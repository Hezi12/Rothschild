const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const DynamicPrice = require('../models/DynamicPrice');
const cloudinary = require('../config/cloudinary');
const { isAvailable } = require('../utils/availability');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const PricePeriod = require('../models/PricePeriod');
const { addDays, format, parseISO, startOfDay, endOfDay, endOfWeek } = require('date-fns');
const { sendBookingConfirmation, sendBookingNotificationToAdmin } = require('../utils/emailService');
const Gallery = require('../models/Gallery');
const path = require('path');
const fs = require('fs');

// פונקציה לחישוב מחיר עם מחירים מיוחדים
const calculatePriceWithSpecialPrices = (room, checkInDate, nights) => {
  let totalNightsPrice = 0;
  let hasSpecialPrices = false;
  
  // אם יש מחירים מיוחדים, חשב לפי ימים
  if (room.specialPrices && room.specialPrices.size > 0) {
    console.log('נמצאו מחירים מיוחדים לחדר:', Object.fromEntries(room.specialPrices));
    
    // הכנת תאריכים לחישוב
    const dates = [];
    const startDate = new Date(checkInDate);
    
    // יצירת מערך של כל התאריכים בשהות
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      dates.push(currentDate);
    }
    
    // חישוב מחיר לפי ימים
    for (const date of dates) {
      const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      
      // בדיקה אם יש מחיר מיוחד ליום זה
      if (room.specialPrices.has(dayOfWeek)) {
        const specialPrice = room.specialPrices.get(dayOfWeek);
        console.log(`מחיר מיוחד ליום ${dayOfWeek} (${date.toLocaleDateString()}): ${specialPrice}₪`);
        totalNightsPrice += specialPrice;
        hasSpecialPrices = true;
      } else {
        console.log(`מחיר רגיל ליום ${dayOfWeek} (${date.toLocaleDateString()}): ${room.basePrice}₪`);
        totalNightsPrice += room.basePrice;
      }
    }
  } else {
    console.log('לא נמצאו מחירים מיוחדים, משתמש במחיר בסיס:', room.basePrice);
    totalNightsPrice = room.basePrice * nights;
  }
  
  return { totalBasePrice: totalNightsPrice, hasSpecialPrices };
};

// פונקציה לחישוב מע"מ ומחיר סופי
const calculateVatAndTotalPrice = (basePrice, isTourist = false, vatRate = 18) => {
  const vatAmount = isTourist ? 0 : (basePrice * vatRate / 100);
  const totalPrice = basePrice + vatAmount;
  
  return {
    basePrice,
    vatRate,
    vatAmount: Math.round(vatAmount * 100) / 100, // עיגול לשתי ספרות אחרי הנקודה
    totalPrice, // מחזירים את המחיר הכולל ללא עיגול
  };
};

// @desc    קבלת כל החדרים
// @route   GET /api/rooms
// @access  Public
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true });
    
    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('שגיאה בקבלת חדרים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    קבלת חדר לפי מזהה
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('שגיאה בקבלת חדר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    יצירת חדר חדש
// @route   POST /api/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  const {
    roomNumber,
    type,
    description,
    basePrice,
    maxOccupancy,
    amenities,
    images,
    isActive
  } = req.body;
  
  try {
    // בדיקה אם כבר קיים חדר עם אותו מספר
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `חדר עם מספר ${roomNumber} כבר קיים במערכת`
      });
    }
    
    // יצירת חדר חדש
    const room = new Room({
      roomNumber,
      type,
      description,
      basePrice,
      maxOccupancy,
      amenities,
      images,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await room.save();
    
    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('שגיאה ביצירת חדר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    עדכון חדר
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
  try {
    console.log('נתוני עדכון חדר שהתקבלו:', req.body);
    
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    // אם מספר החדר השתנה, בדוק שאין חדר עם המספר החדש
    if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ roomNumber: req.body.roomNumber });
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: `חדר עם מספר ${req.body.roomNumber} כבר קיים במערכת`
        });
      }
    }
    
    // וידוא שיש מחיר בסיס תקף
    if (req.body.basePrice === undefined || req.body.basePrice === null) {
      req.body.basePrice = 400; // ברירת מחדל אם לא צוין
    }
    
    // טיפול במפת מחירים מיוחדים
    if (req.body.specialPrices && typeof req.body.specialPrices === 'object' && !Array.isArray(req.body.specialPrices)) {
      console.log('מחירים מיוחדים שהתקבלו:', req.body.specialPrices);
      
      // יצירת מפה חדשה או שימוש במפה הקיימת
      const updatedSpecialPrices = room.specialPrices || new Map();
      
      // ניקוי המפה הקיימת אם מעדכנים את כל הערכים
      if (Object.keys(req.body.specialPrices).length > 0) {
        // נזכור את ערכי המפה הקיימת לפני הריקון
        const oldValues = Object.fromEntries(updatedSpecialPrices);
        console.log('ערכי מפת מחירים מיוחדים לפני עדכון:', oldValues);
        
        // ריקון המפה אם נשלח עדכון מלא
        updatedSpecialPrices.clear();
      }
      
      // עדכון או הוספת ערכים חדשים למפה
      for (const [key, value] of Object.entries(req.body.specialPrices)) {
        if (value !== null && value !== undefined) {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            console.log(`עדכון מחיר מיוחד: ${key} = ${numValue}`);
            updatedSpecialPrices.set(key, numValue);
          } else {
            console.warn(`ערך לא תקף למחיר מיוחד: ${key} = ${value}`);
          }
        }
      }
      
      console.log('מפת מחירים מיוחדים לאחר עדכון:', Object.fromEntries(updatedSpecialPrices));
      
      // שמירת המפה המעודכנת באובייקט הבקשה
      req.body.specialPrices = updatedSpecialPrices;
    }
    
    // עדכון הנתונים
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: updatedRoom
    });
  } catch (error) {
    console.error('שגיאה מפורטת בעדכון חדר:', error);
    
    let errorMessage = 'שגיאת שרת';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'שגיאת אימות נתונים: ' + Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.name === 'CastError') {
      errorMessage = 'ערך לא תקין: ' + error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

// @desc    מחיקת חדר
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    // בדיקה אם יש הזמנות עתידיות לחדר זה
    const futureBookings = await Booking.find({
      room: req.params.id,
      checkOut: { $gte: new Date() },
      status: { $ne: 'canceled' }
    });
    
    if (futureBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'לא ניתן למחוק את החדר כיוון שיש לו הזמנות עתידיות'
      });
    }
    
    await room.deleteOne();
    
    res.json({
      success: true,
      message: 'החדר נמחק בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה במחיקת חדר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    בדיקת זמינות חדר בתאריכים מסוימים
// @route   POST /api/rooms/check-availability
// @access  Public
exports.checkAvailability = asyncHandler(async (req, res, next) => {
  const { roomId, checkIn, checkOut, guests, rooms, isTourist } = req.body;
  
  // בדיקת תקינות נתונים
  if (!checkIn || !checkOut) {
    return next(new ErrorResponse('נא לספק תאריכי צ\'ק-אין וצ\'ק-אאוט', 400));
  }
  
  try {
    // המרת תאריכים
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0); // איפוס השעה
    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0); // איפוס השעה
    
    // בדיקת תקינות התאריכים
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return next(new ErrorResponse('תאריכים לא תקינים', 400));
    }
    
    if (checkInDate >= checkOutDate) {
      return next(new ErrorResponse('תאריך הגעה חייב להיות לפני תאריך עזיבה', 400));
    }
    
    // חישוב מספר לילות
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    // אם נשלח roomId ספציפי, בדוק רק את החדר הזה
    if (roomId) {
      const room = await Room.findById(roomId);
      
      if (!room) {
        return next(new ErrorResponse('החדר לא נמצא', 404));
      }
      
      // בדיקת זמינות
      const available = await isRoomAvailable(roomId, checkInDate, checkOutDate);
      
      // חישוב מחיר
      const priceInfo = calculatePriceWithSpecialPrices(room, checkInDate, nights);
      const vatData = calculateVatAndTotalPrice(priceInfo.totalBasePrice, isTourist);
      
      return res.status(200).json({
        success: true,
        data: {
          isAvailable: available,
          roomId: room._id,
          roomNumber: room.roomNumber,
          internalName: room.internalName,
          type: room.type,
          nights,
          basePrice: room.basePrice,
          nightsTotal: priceInfo.totalBasePrice,
          vatAmount: vatData.vatAmount,
          totalPrice: vatData.totalPrice,
          checkIn,
          checkOut,
          images: room.images,
          amenities: room.amenities,
          description: room.description,
          maxOccupancy: room.maxOccupancy
        }
      });
    }
    
    // אחרת, מצא את כל החדרים הזמינים
    const allRooms = await Room.find({ isActive: true });
    const availableRooms = [];
    
    // מספר החדרים המבוקש (ברירת מחדל 1)
    const requestedRooms = parseInt(rooms) || 1;
    // מספר האורחים המבוקש
    const requestedGuests = parseInt(guests) || 1;
    
    console.log(`חיפוש זמינות: ${requestedGuests} אורחים, ${requestedRooms} חדרים`);
    
    // בדוק זמינות עבור כל חדר פעיל
    for (const room of allRooms) {
      // בדיקות זמינות שונות בהתאם למספר החדרים המבוקש
      if (requestedRooms === 1) {
        // במקרה של חדר בודד - בדוק אם החדר מתאים למספר האורחים המלא
        if (guests && room.maxOccupancy < requestedGuests) {
          continue;
        }
      } else {
        // במקרה של מספר חדרים - החזר את כל החדרים הזמינים 
        // גם אם אינם מתאימים לכל האורחים בחדר בודד
        // כל עוד אינם מתאימים לאורח אחד לפחות
        if (room.maxOccupancy < 1) {
          continue;
        }
      }
      
      const isAvailable = await isRoomAvailable(room._id, checkInDate, checkOutDate);
      
      if (isAvailable) {
        // חישוב מחיר
        const priceInfo = calculatePriceWithSpecialPrices(room, checkInDate, nights);
        const vatData = calculateVatAndTotalPrice(priceInfo.totalBasePrice, isTourist);
        
        availableRooms.push({
          _id: room._id,
          roomNumber: room.roomNumber,
          internalName: room.internalName,
          type: room.type,
          basePrice: room.basePrice,
          nightsTotal: priceInfo.totalBasePrice,
          vatAmount: vatData.vatAmount,
          totalPrice: vatData.totalPrice,
          nights,
          images: room.images,
          amenities: room.amenities,
          description: room.description,
          maxOccupancy: room.maxOccupancy
        });
      }
    }
    
    // במקרה של חיפוש רגיל עם חדר אחד, החזר את החדרים הזמינים כרגיל
    if (requestedRooms === 1) {
      // מיון לפי מחיר מהנמוך לגבוה
      availableRooms.sort((a, b) => a.totalPrice - b.totalPrice);
      
      res.status(200).json({
        success: true,
        data: availableRooms
      });
    } else {
      // במקרה של חיפוש מרובה חדרים, הוסף הודעת הסבר
      res.status(200).json({
        success: true,
        multiRoomBooking: true,
        requestedRooms: requestedRooms,
        requestedGuests: requestedGuests,
        message: `אנא בחר ${requestedRooms} חדרים עבור ${requestedGuests} אורחים`,
        data: availableRooms
      });
    }
  } catch (err) {
    return next(new ErrorResponse(`שגיאה בבדיקת זמינות: ${err.message}`, 500));
  }
});

// ייבוא פונקציה לבדיקת זמינות חדר ממודול אחר
const isRoomAvailable = async (roomId, checkInDate, checkOutDate) => {
  // וידוא שאנחנו עובדים עם אובייקטי תאריך ואיפוס השעה
  const startDate = new Date(checkInDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(checkOutDate);
  endDate.setHours(0, 0, 0, 0);

  // בניית שאילתה משולבת שבודקת גם הזמנות רגילות וגם הזמנות מרובות חדרים
  const query = {
    status: { $ne: 'canceled' },
    $or: [
      // בדיקת הזמנות רגילות (חדר בודד)
      {
        room: roomId,
        $or: [
          // מקרה 1: תאריך הגעה חדש בין תאריכי הזמנה קיימת
          {
            checkIn: { $lte: startDate },
            checkOut: { $gt: startDate }
          },
          // מקרה 2: תאריך עזיבה חדש בין תאריכי הזמנה קיימת
          {
            checkIn: { $lt: endDate },
            checkOut: { $gte: endDate }
          },
          // מקרה 3: תאריכי הזמנה חדשה מכילים הזמנה קיימת
          {
            checkIn: { $gte: startDate },
            checkOut: { $lte: endDate }
          }
        ]
      },
      // בדיקת הזמנות מרובות חדרים
      {
        rooms: roomId,
        $or: [
          // מקרה 1: תאריך הגעה חדש בין תאריכי הזמנה קיימת
          {
            checkIn: { $lte: startDate },
            checkOut: { $gt: startDate }
          },
          // מקרה 2: תאריך עזיבה חדש בין תאריכי הזמנה קיימת
          {
            checkIn: { $lt: endDate },
            checkOut: { $gte: endDate }
          },
          // מקרה 3: תאריכי הזמנה חדשה מכילים הזמנה קיימת
          {
            checkIn: { $gte: startDate },
            checkOut: { $lte: endDate }
          }
        ]
      }
    ]
  };
  
  // בדיקה אם יש הזמנות חופפות
  const overlappingBookings = await Booking.find(query);
  
  console.log(`בדיקת זמינות בתצוגת חדרים לחדר ${roomId}: נמצאו ${overlappingBookings.length} הזמנות חופפות בתאריכים ${startDate} עד ${endDate}`);
  
  return overlappingBookings.length === 0;
};

// @desc    בדיקת זמינות מספר חדרים
// @route   POST /api/rooms/check-multiple-availability
// @access  Public
exports.checkMultipleAvailability = asyncHandler(async (req, res, next) => {
  const { roomIds, checkIn, checkOut, isTourist } = req.body;
  
  // בדיקת תקינות נתונים
  if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0 || !checkIn || !checkOut) {
    return next(new ErrorResponse('נא לספק רשימת חדרים ותאריכים תקינים', 400));
  }
  
  try {
    // בדיקת זמינות לכל חדר
    const availabilityResults = await Promise.all(
      roomIds.map(async (roomId) => {
        const room = await Room.findById(roomId);
        
        if (!room) {
          throw new Error(`חדר עם מזהה ${roomId} לא נמצא`);
        }
        
        // בדיקת זמינות
        const available = await isAvailable(roomId, checkIn, checkOut);
        
        // חישוב מספר לילות
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        
        // חישוב מחירים לחדר זה עם התחשבות במחירים מיוחדים
        const priceInfo = calculatePriceWithSpecialPrices(room, checkInDate, nights);
        const vatData = calculateVatAndTotalPrice(priceInfo.totalBasePrice, isTourist);
        
        return {
          roomId: room._id,
          roomName: room.name,
          roomType: room.type,
          isAvailable: available,
          nights,
          basePrice: room.basePrice,
          nightsTotal: priceInfo.totalBasePrice,
          vatAmount: vatData.vatAmount,
          totalPrice: vatData.totalPrice
        };
      })
    );
    
    // חישוב סכומים כוללים לכל החדרים
    const totalBasePrice = availabilityResults.reduce((sum, room) => sum + room.nightsTotal, 0);
    const totalVatAmount = availabilityResults.reduce((sum, room) => sum + room.vatAmount, 0);
    const finalTotalPrice = totalBasePrice + totalVatAmount;
    
    // בדיקה אם כל החדרים זמינים
    const allRoomsAvailable = availabilityResults.every(room => room.isAvailable);
    
    res.status(200).json({
      success: true,
      data: {
        rooms: availabilityResults,
        allRoomsAvailable,
        totalBasePrice,
        totalVatAmount,
        totalPrice: finalTotalPrice,
        nights: availabilityResults[0].nights,
        checkIn,
        checkOut
      }
    });
  } catch (err) {
    return next(new ErrorResponse(`שגיאה בבדיקת זמינות חדרים: ${err.message}`, 500));
  }
});

// @desc    יצירת הזמנה מרובת חדרים
// @route   POST /api/bookings/multi-room
// @access  Private
exports.createMultiRoomBooking = asyncHandler(async (req, res, next) => {
  const {
    roomIds,
    checkIn,
    checkOut,
    guest,
    paymentMethod,
    creditCard,
    isTourist,
    totalPrice,
    basePrice,
    vatAmount,
    nights,
    status = 'confirmed',
    notes
  } = req.body;
  
  console.log(`התחלת יצירת הזמנה מרובת חדרים: ${roomIds.length} חדרים, תאריכי צ'ק-אין: ${checkIn}, צ'ק-אאוט: ${checkOut}`);
  
  // בדיקת תקינות נתונים
  if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0 || !checkIn || !checkOut || !guest) {
    console.error('שגיאת תיקוף: חסרים פרטי הזמנה הכרחיים');
    return next(new ErrorResponse('נא לספק את כל פרטי ההזמנה הנדרשים', 400));
  }
  
  try {
    // בדיקת זמינות החדרים
    console.log(`בודק זמינות עבור ${roomIds.length} חדרים בתאריכים ${checkIn} עד ${checkOut}`);
    const availabilityResults = await Promise.all(
      roomIds.map(async (roomId) => {
        console.log(`בודק זמינות לחדר ${roomId}`);
        const available = await isAvailable(roomId, checkIn, checkOut);
        console.log(`חדר ${roomId} זמין: ${available}`);
        return { roomId, available };
      })
    );
    
    // בדיקה אם כל החדרים זמינים
    const unavailableRooms = availabilityResults.filter(room => !room.available);
    
    if (unavailableRooms.length > 0) {
      console.error(`נמצאו ${unavailableRooms.length} חדרים לא זמינים: ${JSON.stringify(unavailableRooms.map(r => r.roomId))}`);
      return next(new ErrorResponse(`חדר אחד או יותר אינו זמין בתאריכים שנבחרו`, 400));
    }
    
    console.log('כל החדרים זמינים, ממשיך ליצירת ההזמנה');
    
    // חישוב מספר לילות אם לא סופק
    const calculatedNights = nights || Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    console.log(`מספר לילות: ${calculatedNights}`);

    // חישוב מחירים אם לא סופקו
    const rooms = await Promise.all(roomIds.map(id => Room.findById(id)));
    const calculatedBasePrice = basePrice || rooms.reduce((sum, room) => sum + (room ? room.basePrice * calculatedNights : 0), 0);
    const calculatedVatAmount = vatAmount || (isTourist ? 0 : calculatedBasePrice * 0.18);
    const calculatedTotalPrice = totalPrice || calculatedBasePrice + calculatedVatAmount;
    
    console.log(`מחיר בסיס: ${calculatedBasePrice}, מע"מ: ${calculatedVatAmount}, סה"כ: ${calculatedTotalPrice}`);
    
    // יצירת מספר הזמנה ייחודי
    const bookingNumber = await require('../controllers/bookingController').generateBookingNumber();
    console.log(`נוצר מספר הזמנה: ${bookingNumber}`);
    
    // יצירת הזמנה מרובת חדרים
    const multiBooking = {
      rooms: roomIds,
      isMultiRoomBooking: true,
      totalRooms: roomIds.length,
      bookingNumber,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      nights: calculatedNights,
      guest,
      paymentMethod: paymentMethod || 'credit',
      creditCard,
      isTourist: !!isTourist,
      basePrice: calculatedBasePrice,
      vatRate: 18,
      vatAmount: calculatedVatAmount,
      totalPrice: calculatedTotalPrice,
      status: status || 'confirmed',
      notes: notes || '',
      bookingDate: new Date()
    };
    
    console.log(`יוצר הזמנה מרובת חדרים עם הפרטים: ${JSON.stringify({
      bookingNumber,
      rooms: roomIds,
      checkIn,
      checkOut,
      nights: calculatedNights,
      totalPrice: calculatedTotalPrice
    })}`);
    
    const booking = await Booking.create(multiBooking);
    console.log(`הזמנה מרובת חדרים נוצרה בהצלחה: ${booking._id}, מספר הזמנה: ${booking.bookingNumber}`);
    
    // שליחת אימייל אישור ללקוח
    try {
      if (booking.guest.email && booking.guest.email !== '' && booking.guest.email !== 'guest@example.com') {
        await sendBookingConfirmation(booking);
        console.log('נשלח אימייל אישור הזמנה ללקוח');
      } else {
        console.log(`לא נשלח אימייל אישור להזמנה ${booking.bookingNumber} - אין כתובת אימייל תקפה`);
      }
      
      // שליחת התראה למנהל על הזמנה חדשה
      await sendBookingNotificationToAdmin(booking);
      console.log(`נשלחה התראה למנהל על הזמנה חדשה מרובת חדרים ${booking.bookingNumber}`);
    } catch (emailError) {
      console.error('שגיאה בשליחת אימייל:', emailError);
      // ממשיכים למרות שגיאה בשליחת האימייל
    }
    
    res.status(201).json({
        success: true,
      data: booking,
      bookingNumber: booking.bookingNumber
    });
  } catch (err) {
    console.error(`שגיאה ביצירת הזמנה מרובת חדרים: ${err.message}`, err);
    return next(new ErrorResponse(`שגיאה ביצירת הזמנה מרובת חדרים: ${err.message}`, 500));
  }
});

// @desc    עדכון מחירים מיוחדים לפי ימי שבוע לחדר ספציפי
// @route   PUT /api/rooms/:id/special-prices
// @access  Private/Admin
exports.updateRoomSpecialPrices = async (req, res) => {
  try {
    const roomId = req.params.id;
    const { specialPrices } = req.body;

    console.log('עדכון מחירים מיוחדים:', {
      roomId,
      specialPrices
    });

    // וידוא שהחדר קיים
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר לא נמצא'
      });
    }

    // עדכון מחירים מיוחדים
    if (!room.specialPrices) {
      room.specialPrices = new Map();
    }

    // עדכון או יצירה של מחירים מיוחדים לפי ימי שבוע
    for (const [day, priceInfo] of Object.entries(specialPrices)) {
      try {
        if (priceInfo && priceInfo.enabled && priceInfo.price > 0) {
          // המרה למספר
          const price = Number(priceInfo.price);
          if (isNaN(price)) {
            console.warn(`המחיר ${priceInfo.price} ליום ${day} אינו מספר תקף`);
            continue;
          }
          room.specialPrices.set(day, price);
        } else if (room.specialPrices.has(day)) {
          room.specialPrices.delete(day);
        }
      } catch (priceError) {
        console.error(`שגיאה בעיבוד מחיר מיוחד ליום ${day}:`, priceError);
      }
    }

    await room.save();

    res.json({
      success: true,
      specialPrices: Object.fromEntries(room.specialPrices),
      message: 'המחירים המיוחדים עודכנו בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה מפורטת בעדכון מחירים מיוחדים:', error);
    
    let errorMessage = 'שגיאת שרת';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'שגיאת אימות נתונים: ' + Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.name === 'CastError') {
      errorMessage = 'ערך לא תקין: ' + error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

// @desc    קבלת מחירים מיוחדים לפי ימי שבוע לחדר ספציפי
// @route   GET /api/rooms/:id/special-prices
// @access  Private/Admin
exports.getRoomSpecialPrices = async (req, res) => {
  try {
    const roomId = req.params.id;

    // וידוא שהחדר קיים
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר לא נמצא'
      });
    }

    // המרת המפה לאובייקט JSON רגיל
    const specialPricesObj = room.specialPrices ? Object.fromEntries(room.specialPrices) : {};
    console.log('מחירים מיוחדים שנשלחים ללקוח:', specialPricesObj);

    res.json({
      success: true,
      specialPrices: specialPricesObj
    });
  } catch (error) {
    console.error('שגיאה בקבלת מחירים מיוחדים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
}; 

// Make the functions available for export
exports.calculatePriceWithSpecialPrices = calculatePriceWithSpecialPrices;
exports.calculateVatAndTotalPrice = calculateVatAndTotalPrice; 