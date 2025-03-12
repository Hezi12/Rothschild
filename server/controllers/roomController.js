const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

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
      // המרת מבנה JSON למפה מונגו
      const convertedSpecialPrices = {};
      for (const [key, value] of Object.entries(req.body.specialPrices)) {
        if (value !== null && value !== undefined) {
          convertedSpecialPrices[key] = Number(value);
        }
      }
      req.body.specialPrices = convertedSpecialPrices;
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

// @desc    בדיקת זמינות חדרים
// @route   POST /api/rooms/check-availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, guests, isTourist = false } = req.body;
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'יש לספק תאריכי הגעה ועזיבה'
      });
    }
    
    // המרת התאריכים לאובייקטי תאריך וקביעת שעות לחצות (00:00)
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    
    // חישוב מספר לילות
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // פונקציה לחישוב מע"מ ומחיר סופי
    const calculateVatAndTotalPrice = (basePrice, isTourist = false, vatRate = 18) => {
      const vatAmount = isTourist ? 0 : (basePrice * vatRate / 100);
      const totalPrice = basePrice + vatAmount;
      
      return {
        basePrice,
        vatRate,
        vatAmount: Math.round(vatAmount * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100
      };
    };
    
    // אם סופק חדר ספציפי לבדיקה
    if (roomId) {
      const room = await Room.findById(roomId);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'החדר לא נמצא'
        });
      }
      
      // בדיקה אם יש הזמנות חופפות
      const overlappingBookings = await Booking.find({
        room: roomId,
        status: { $ne: 'canceled' },
        $or: [
          // צ'ק-אין בתוך תקופת הזמנה קיימת
          { 
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
          }
        ]
      });
      
      // אם יש הזמנות חופפות, החדר לא זמין
      if (overlappingBookings.length > 0) {
        return res.json({
          success: true,
          isAvailable: false,
          reason: 'קיימת הזמנה בתאריכים אלה',
          room: {
            id: room._id,
            roomNumber: room.roomNumber,
            basePrice: room.basePrice
          }
        });
      }
      
      // אם אין הזמנות חופפות, החדר זמין
      // חישוב מחיר (כולל/לא כולל מע"מ בהתאם למעמד התייר)
      const basePrice = room.basePrice;
      const totalNightsPrice = basePrice * nights;
      const priceDetails = calculateVatAndTotalPrice(totalNightsPrice, isTourist);
      
      return res.json({
        success: true,
        isAvailable: true,
        room: {
          id: room._id,
          roomNumber: room.roomNumber,
          basePrice: room.basePrice
        },
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        basePrice,
        nightsTotal: totalNightsPrice,
        vatRate: priceDetails.vatRate,
        vatAmount: priceDetails.vatAmount,
        totalPrice: priceDetails.totalPrice,
        isTourist
      });
    } else {
      // אם לא סופק מזהה חדר, בדוק את כל החדרים הזמינים
      const allRooms = await Room.find({ isActive: true });
      const availableRooms = [];

      // בדיקה עבור כל חדר
      for (const room of allRooms) {
        // תנאי סינון נוספים - לפי כמות מקס של אורחים
        if (guests && room.maxOccupancy < guests) {
          continue; // דלג על חדרים שלא תואמים למספר האורחים
        }

        // בדיקה אם יש הזמנות חופפות לחדר
        const overlappingBookings = await Booking.find({
          room: room._id,
          status: { $ne: 'canceled' },
          $or: [
            { 
              checkIn: { $lt: checkOutDate },
              checkOut: { $gt: checkInDate }
            }
          ]
        });
        
        // אם אין הזמנות חופפות, החדר זמין
        if (overlappingBookings.length === 0) {
          availableRooms.push(room);
        }
      }
      
      return res.json({
        success: true,
        count: availableRooms.length,
        data: availableRooms
      });
    }
  } catch (error) {
    console.error('שגיאה בבדיקת זמינות:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

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

    res.json({
      success: true,
      specialPrices: room.specialPrices || {}
    });
  } catch (error) {
    console.error('שגיאה בקבלת מחירים מיוחדים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
}; 