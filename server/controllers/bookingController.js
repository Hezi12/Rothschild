const Booking = require('../models/Booking');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const { startOfDay, endOfDay, parseISO, format, addHours } = require('date-fns');
const { validationResult } = require('express-validator');
const { sendBookingConfirmation } = require('../utils/emailService');
const DynamicPrice = require('../models/DynamicPrice');

/**
 * בקר חדש ומשופר להזמנות, ללא תלות במודל תאריכים חסומים
 */

// פונקציה ליצירת מספר הזמנה חדש
const generateBookingNumber = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().substring(2);
    
    // מציאת המספר הגבוה ביותר השנה
    const highestBooking = await Booking.findOne(
      { bookingNumber: { $regex: `^${yearPrefix}` } },
      { bookingNumber: 1 }
    ).sort({ bookingNumber: -1 });
    
    // אם לא נמצאו הזמנות השנה - יצירת מספר התחלתי
    if (!highestBooking) {
      return `${yearPrefix}1001`;
    }
    
    // הפרדה בין תחילית השנה למספר הסידורי
    const currentNumber = parseInt(highestBooking.bookingNumber.substring(2));
    return `${yearPrefix}${currentNumber + 1}`;
  } catch (error) {
    console.error('שגיאה ביצירת מספר הזמנה:', error);
    // במקרה של שגיאה - שימוש במספר חד-ערכי מבוסס זמן
    return `${new Date().getTime().toString().substring(0, 10)}`;
  }
};

// פונקציה לבדיקת זמינות חדר בתאריכים מבוקשים
const checkRoomAvailability = async (roomId, checkInDate, checkOutDate, excludeBookingId = null) => {
  // המרת תאריכים למבנה אחיד
  const startDate = startOfDay(new Date(checkInDate));
  const endDate = startOfDay(new Date(checkOutDate));
  
  // בניית שאילתת חיפוש
  const query = {
    room: roomId,
    status: { $ne: 'canceled' },
    $or: [
      { // צ'ק-אין בתוך ההזמנה הקיימת
        checkIn: { $lte: endDate },
        checkOut: { $gt: startDate }
      }
    ]
  };
  
  // אם יש מזהה הזמנה לא לכלול, נוסיף לשאילתה
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  // חיפוש הזמנות חופפות
  const conflictingBookings = await Booking.find(query).populate('room', 'roomNumber type');
  
  return {
    isAvailable: conflictingBookings.length === 0,
    conflictingBookings
  };
};

// חישוב מחיר חדר לתקופה
const calculateRoomPrice = async (roomId, checkIn, checkOut) => {
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('החדר לא נמצא');
    }

    // תאריכי ביניים
    const dates = [];
    let currentDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    
    // מחיר כולל לחדר
    let totalPrice = 0;
    
    // יצירת מערך תאריכים בין תאריך ההגעה ליום לפני העזיבה
    while (currentDate < endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // לולאה על כל התאריכים לחישוב המחיר הסופי
    for (let date of dates) {
      // חיפוש מחיר דינמי ספציפי לתאריך
      const dynamicPrice = await DynamicPrice.findOne({
        room: roomId,
        date: {
          $gte: startOfDay(date),
          $lte: endOfDay(date)
        }
      });
      
      if (dynamicPrice) {
        // אם נמצא מחיר דינמי לתאריך, השתמש בו
        totalPrice += dynamicPrice.price;
      } else {
        // ללא מחיר דינמי, בדוק אם יש מחיר מיוחד ליום בשבוע
        const dayOfWeek = date.getDay(); // 0 = ראשון, 1 = שני, וכו'
        
        if (room.specialPrices && room.specialPrices.has(dayOfWeek.toString())) {
          totalPrice += parseFloat(room.specialPrices.get(dayOfWeek.toString()));
        } else {
          // אם אין מחיר דינמי או מחיר מיוחד ליום בשבוע, השתמש במחיר הבסיסי
          totalPrice += room.basePrice;
        }
      }
    }
    
    return totalPrice;
  } catch (error) {
    console.error('שגיאה בחישוב מחיר חדר:', error);
    throw error;
  }
};

// פונקציות עזר לתאריכים
// פונקציות startOfDay ו-endOfDay כבר מיובאות מ-date-fns בראש הקובץ

// יצירת הזמנה חדשה 
exports.createBooking = async (req, res) => {
  try {
    const {
      roomId,
      checkIn,
      checkOut,
      nights,
      basePrice,
      totalPrice,
      isTourist,
      guest,
      creditCard,
      notes,
      source
    } = req.body;
    
    if (!roomId || !checkIn || !checkOut || !guest || !guest.name) {
      return res.status(400).json({
        success: false,
        message: 'חסרים שדות חובה'
      });
    }
    
    const checkInDate = startOfDay(new Date(checkIn));
    const checkOutDate = startOfDay(new Date(checkOut));
    
    // בדיקת זמינות החדר
    const { isAvailable, conflictingBookings } = await checkRoomAvailability(roomId, checkInDate, checkOutDate);
    
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'החדר אינו זמין בתאריכים המבוקשים',
        conflicts: conflictingBookings.map(booking => ({
          bookingNumber: booking.bookingNumber,
          room: booking.room?.roomNumber,
          checkIn: format(booking.checkIn, 'yyyy-MM-dd'),
          checkOut: format(booking.checkOut, 'yyyy-MM-dd'),
          guestName: booking.guest.name
        }))
      });
    }
    
    // בדיקת קיום החדר
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר המבוקש לא נמצא'
      });
    }
    
    // יצירת מספר הזמנה ייחודי
    const bookingNumber = await generateBookingNumber();
    
    // חישוב מחיר אם לא סופק
    const calculatedTotalPrice = totalPrice || (basePrice || room.basePrice) * nights;
    
    // יצירת הזמנה חדשה
    const booking = new Booking({
      bookingNumber,
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      basePrice: basePrice || room.basePrice,
      totalPrice: calculatedTotalPrice,
      isTourist: isTourist || false,
      guest,
      creditCard,
      notes,
      status: 'confirmed',
      paymentStatus: 'pending',
      source: source || 'direct'
    });
    
    await booking.save();
    
    res.status(201).json({
      success: true,
      message: 'ההזמנה נוצרה בהצלחה',
      booking: {
        ...booking.toObject(),
        room: {
          _id: room._id,
          roomNumber: room.roomNumber,
          type: room.type,
          basePrice: room.basePrice
        }
      }
    });
  } catch (error) {
    console.error('שגיאה ביצירת הזמנה:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה ביצירת ההזמנה',
      error: error.message
    });
  }
};

// קבלת כל ההזמנות
exports.getBookings = async (req, res) => {
  try {
    // פרמטרים לסינון וחיפוש
    let { 
      startDate, endDate, roomId, status, 
      guestName, paymentStatus, sortBy = 'checkIn', 
      limit = 100, page = 1, minNights, maxNights,
      sortOrder = 'asc'
    } = req.query;
    
    // בניית שאילתת חיפוש
    const query = {};
    
    // סינון לפי תאריכים
    if (startDate || endDate) {
      query.$or = [];
      
      if (startDate) {
        const start = startOfDay(new Date(startDate));
        if (endDate) {
          const end = endOfDay(new Date(endDate));
          // הזמנות שמתחילות או מסתיימות בטווח, או שמכילות את הטווח
          query.$or.push(
            { checkIn: { $gte: start, $lte: end } },
            { checkOut: { $gt: start, $lte: end } },
            { 
              checkIn: { $lte: start },
              checkOut: { $gte: end }
            }
          );
        } else {
          query.$or.push(
            { checkIn: { $gte: start } },
            { checkOut: { $gte: start } }
          );
        }
      } else if (endDate) {
        const end = endOfDay(new Date(endDate));
        query.$or.push({ checkIn: { $lte: end } });
      }
    }
    
    // סינון לפי חדר
    if (roomId) {
      query.room = roomId;
    }
    
    // סינון לפי סטטוס
    if (status) {
      query.status = status;
    }
    
    // סינון לפי שם אורח
    if (guestName) {
      query['guest.name'] = { $regex: guestName, $options: 'i' };
    }
    
    // סינון לפי סטטוס תשלום
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // סינון לפי מספר לילות
    if (minNights || maxNights) {
      query.nights = {};
      if (minNights) query.nights.$gte = parseInt(minNights);
      if (maxNights) query.nights.$lte = parseInt(maxNights);
    }
    
    // יצירת מיון
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // חישוב פרמטרים לעימוד
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // ביצוע השאילתה עם יחס
    const bookings = await Booking.find(query)
      .populate('room', 'roomNumber type basePrice')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // ספירת סך הכל תוצאות עבור עימוד
    const total = await Booking.countDocuments(query);
    
    res.json({
      success: true,
      count: bookings.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: bookings
    });
  } catch (error) {
    console.error('שגיאה בקבלת ההזמנות:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בקבלת ההזמנות',
      error: error.message
    });
  }
};

// קבלת הזמנה לפי מזהה
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'roomNumber type basePrice');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('שגיאה בקבלת ההזמנה:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בקבלת ההזמנה',
      error: error.message
    });
  }
};

// עדכון הזמנה
exports.updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const updateData = { ...req.body };
    
    // מחיקת שדות שלא ניתן לעדכן ישירות
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // בדיקה אם ההזמנה קיימת
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }
    
    // בדיקה אם יש שינוי בחדר, תאריך הגעה או תאריך עזיבה
    const isRoomChanged = updateData.roomId && updateData.roomId !== booking.room.toString();
    const isCheckInChanged = updateData.checkIn && new Date(updateData.checkIn).getTime() !== booking.checkIn.getTime();
    const isCheckOutChanged = updateData.checkOut && new Date(updateData.checkOut).getTime() !== booking.checkOut.getTime();
    
    // אם יש שינוי בחדר או בתאריכים, בדוק זמינות
    if (isRoomChanged || isCheckInChanged || isCheckOutChanged) {
      const roomId = isRoomChanged ? updateData.roomId : booking.room;
      const checkInDate = isCheckInChanged ? new Date(updateData.checkIn) : booking.checkIn;
      const checkOutDate = isCheckOutChanged ? new Date(updateData.checkOut) : booking.checkOut;
      
      // בדיקת זמינות החדר
      const { isAvailable, conflictingBookings } = await checkRoomAvailability(
        roomId, checkInDate, checkOutDate, bookingId
      );
      
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'החדר אינו זמין בתאריכים המבוקשים',
          conflicts: conflictingBookings.map(booking => ({
            bookingNumber: booking.bookingNumber,
            room: booking.room?.roomNumber,
            checkIn: format(booking.checkIn, 'yyyy-MM-dd'),
            checkOut: format(booking.checkOut, 'yyyy-MM-dd'),
            guestName: booking.guest.name
          }))
        });
      }
      
      // חישוב מחיר חדש אם השתנו התאריכים או החדר
      const calculatedTotalPrice = await calculateRoomPrice(roomId, checkInDate, checkOutDate);
      updateData.totalPrice = calculatedTotalPrice;
      
      // עדכון מספר לילות אם השתנו התאריכים
      if (isCheckInChanged || isCheckOutChanged) {
        const diffTime = Math.abs(checkOutDate - checkInDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        updateData.nights = diffDays;
      }
    }
    
    // אם השתנה החדר
    if (isRoomChanged) {
      updateData.room = updateData.roomId;
      delete updateData.roomId;
    }
    
    // עדכון חותמת הזמן
    updateData.updatedAt = new Date();
    
    // ביצוע העדכון
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: false }
    ).populate('room', 'roomNumber type basePrice');
    
    res.json({
      success: true,
      message: 'ההזמנה עודכנה בהצלחה',
      data: updatedBooking
    });
  } catch (error) {
    console.error('שגיאה בעדכון ההזמנה:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בעדכון ההזמנה',
      error: error.message
    });
  }
};

// מחיקת הזמנה (ביטול)
exports.deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    // עדכון ישיר של ההזמנה ל"מבוטל" ללא טעינה מלאה ושמירה
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { 
        $set: { 
          status: 'canceled',
          updatedAt: new Date()
        } 
      },
      { new: true, runValidators: false }
    );
    
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }
    
    res.json({
      success: true,
      message: 'ההזמנה בוטלה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה בביטול ההזמנה:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בביטול ההזמנה',
      error: error.message
    });
  }
};

// עדכון סטטוס תשלום
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paidAmount, paymentMethod } = req.body;
    
    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'חסר סטטוס תשלום'
      });
    }
    
    // בניית אובייקט עדכון
    const updateData = {
      paymentStatus,
      updatedAt: new Date()
    };
    
    // הוספת שדות אופציונליים אם סופקו
    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
    }
    
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    
    // עדכון ההזמנה ישירות
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: false }
    );
    
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }
    
    res.json({
      success: true,
      message: 'סטטוס התשלום עודכן בהצלחה',
      data: updatedBooking
    });
  } catch (error) {
    console.error('שגיאה בעדכון סטטוס תשלום:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בעדכון סטטוס התשלום',
      error: error.message
    });
  }
};

// בדיקת זמינות חדר
exports.checkAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut } = req.body;
    
    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'חסרים פרמטרים: נדרש מזהה חדר, תאריך הגעה ותאריך עזיבה'
      });
    }
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // בדיקת תקינות התאריכים
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'תאריכים לא תקינים'
      });
    }
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'תאריך ההגעה חייב להיות לפני תאריך העזיבה'
      });
    }
    
    // בדיקת זמינות החדר
    const { isAvailable, conflictingBookings } = await checkRoomAvailability(
      roomId, checkInDate, checkOutDate
    );
    
    // חישוב מחיר החדר לתקופה
    const totalPrice = await calculateRoomPrice(roomId, checkInDate, checkOutDate);
    
    // חישוב מספר הלילות
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    // קבלת פרטי החדר
    const room = await Room.findById(roomId).select('roomNumber type basePrice maxOccupancy');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר לא נמצא'
      });
    }
    
    res.json({
      success: true,
      isAvailable,
      room,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      basePrice: room.basePrice,
      totalPrice,
      conflicts: isAvailable ? [] : conflictingBookings.map(booking => ({
        bookingNumber: booking.bookingNumber,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut
      }))
    });
  } catch (error) {
    console.error('שגיאה בבדיקת זמינות:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בבדיקת הזמינות',
      error: error.message
    });
  }
};

// קבלת סטטיסטיקות הזמנות
exports.getBookingsStats = async (req, res) => {
  try {
    // שליפת נתונים סטטיסטיים
    const totalBookings = await Booking.countDocuments({ status: { $ne: 'canceled' } });
    const pendingPayments = await Booking.countDocuments({ paymentStatus: 'pending', status: 'confirmed' });
    const upcomingBookings = await Booking.countDocuments({ 
      checkIn: { $gte: startOfDay(new Date()) },
      status: 'confirmed' 
    });
    
    // סטטיסטיקה לפי סטטוס
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // סטטיסטיקה לפי סטטוס תשלום
    const bookingsByPaymentStatus = await Booking.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]);
    
    // סטטיסטיקה לפי חודשים - השנה הנוכחית
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const bookingsByMonth = await Booking.aggregate([
      { 
        $match: { 
          checkIn: { $gte: startOfYear, $lte: endOfYear },
          status: { $ne: 'canceled' }
        } 
      },
      {
        $group: {
          _id: { $month: '$checkIn' },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalBookings,
        pendingPayments,
        upcomingBookings,
        bookingsByStatus: bookingsByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        bookingsByPaymentStatus: bookingsByPaymentStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        bookingsByMonth: bookingsByMonth.map(item => ({
          month: item._id,
          count: item.count,
          revenue: item.revenue
        }))
      }
    });
  } catch (error) {
    console.error('שגיאה בקבלת סטטיסטיקות הזמנות:', error);
    res.status(500).json({
      success: false,
      message: 'אירעה שגיאה בקבלת סטטיסטיקות הזמנות',
      error: error.message
    });
  }
};

// @desc    קבלת כל ההזמנות לחדר מסוים
// @route   GET /api/bookings/room/:roomId
// @access  Private/Admin
exports.getRoomBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ room: req.params.roomId })
      .sort({ checkIn: 1 });
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('שגיאה בקבלת הזמנות לחדר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
}; 