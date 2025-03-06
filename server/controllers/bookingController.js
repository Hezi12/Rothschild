const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { validationResult } = require('express-validator');
const { sendBookingConfirmation } = require('../utils/emailService');

// @desc    קבלת כל ההזמנות
// @route   GET /api/bookings
// @access  Private/Admin
exports.getBookings = async (req, res) => {
  try {
    // אפשרות לסינון לפי תאריכים
    const { startDate, endDate, status } = req.query;
    let query = {};
    
    // סינון לפי תאריכים
    if (startDate && endDate) {
      query = {
        $or: [
          // צ'ק-אין בטווח התאריכים
          { 
            checkIn: { 
              $gte: new Date(startDate), 
              $lte: new Date(endDate) 
            } 
          },
          // צ'ק-אאוט בטווח התאריכים
          { 
            checkOut: { 
              $gte: new Date(startDate), 
              $lte: new Date(endDate) 
            } 
          },
          // טווח התאריכים מכיל את תקופת ההזמנה
          { 
            checkIn: { $lte: new Date(startDate) },
            checkOut: { $gte: new Date(endDate) }
          }
        ]
      };
    }
    
    // סינון לפי סטטוס תשלום
    if (status) {
      query.paymentStatus = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('room', 'roomNumber type basePrice')
      .sort({ checkIn: 1 });
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('שגיאה בקבלת הזמנות:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    קבלת הזמנה לפי מזהה
// @route   GET /api/bookings/:id
// @access  Private/Admin
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'roomNumber type basePrice images');
    
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
    console.error('שגיאה בקבלת הזמנה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    יצירת הזמנה חדשה
// @route   POST /api/bookings
// @access  Public
exports.createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { 
    roomId, 
    guest, 
    checkIn, 
    checkOut, 
    isTourist, 
    paymentMethod, 
    creditCardDetails,
    notes 
  } = req.body;

  try {
    // בדיקה אם החדר קיים
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    // המרת תאריכים לאובייקטי Date
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // חישוב מספר הלילות
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'תאריכי צ\'ק-אין וצ\'ק-אאוט אינם תקינים' 
      });
    }
    
    // בדיקה אם החדר זמין בתאריכים המבוקשים
    const overlappingBookings = await Booking.find({
      room: roomId,
      $or: [
        // צ'ק-אין בתוך תקופת הזמנה קיימת
        { 
          checkIn: { $lte: checkInDate },
          checkOut: { $gt: checkInDate }
        },
        // צ'ק-אאוט בתוך תקופת הזמנה קיימת
        { 
          checkIn: { $lt: checkOutDate },
          checkOut: { $gte: checkOutDate }
        },
        // תקופת ההזמנה מכילה הזמנה קיימת
        { 
          checkIn: { $gte: checkInDate },
          checkOut: { $lte: checkOutDate }
        }
      ]
    });
    
    if (overlappingBookings.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'החדר אינו זמין בתאריכים המבוקשים' 
      });
    }
    
    // חישוב מחיר כולל
    let totalPrice = room.basePrice * nights;
    
    // הוספת מע"מ אם הלקוח אינו תייר
    if (!isTourist) {
      totalPrice = totalPrice * 1.17; // 17% מע"מ
    }
    
    // יצירת הזמנה חדשה
    const booking = new Booking({
      room: roomId,
      guest,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      totalPrice,
      isTourist,
      paymentMethod,
      creditCardDetails,
      notes,
      createdBy: req.user ? req.user.id : null
    });
    
    // שמירת ההזמנה במסד הנתונים
    await booking.save();
    
    // שליחת אימייל אישור
    try {
      await sendBookingConfirmation(booking, room);
      console.log('אימייל אישור הזמנה נשלח ללקוח');
    } catch (emailError) {
      console.error('שגיאה בשליחת אימייל אישור:', emailError);
      // ממשיכים למרות שגיאה בשליחת האימייל
    }
    
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('שגיאה ביצירת הזמנה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    עדכון הזמנה
// @route   PUT /api/bookings/:id
// @access  Private/Admin
exports.updateBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { 
    roomId, 
    guest, 
    checkIn, 
    checkOut, 
    isTourist, 
    paymentStatus,
    paymentMethod, 
    creditCardDetails,
    notes 
  } = req.body;

  try {
    let booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'ההזמנה לא נמצאה' 
      });
    }
    
    // אם יש שינוי בחדר, בדוק אם החדר החדש קיים
    let room = booking.room;
    if (roomId && roomId !== booking.room.toString()) {
      room = await Room.findById(roomId);
      
      if (!room) {
        return res.status(404).json({ 
          success: false, 
          message: 'החדר לא נמצא' 
        });
      }
    } else {
      room = await Room.findById(booking.room);
    }
    
    // אם יש שינוי בתאריכים, בדוק זמינות
    let checkInDate = booking.checkIn;
    let checkOutDate = booking.checkOut;
    let nights = booking.nights;
    
    if ((checkIn && new Date(checkIn).getTime() !== booking.checkIn.getTime()) || 
        (checkOut && new Date(checkOut).getTime() !== booking.checkOut.getTime())) {
      
      checkInDate = checkIn ? new Date(checkIn) : booking.checkIn;
      checkOutDate = checkOut ? new Date(checkOut) : booking.checkOut;
      
      // חישוב מספר הלילות
      nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      
      if (nights <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'תאריכי צ\'ק-אין וצ\'ק-אאוט אינם תקינים' 
        });
      }
      
      // בדיקה אם החדר זמין בתאריכים החדשים (מלבד ההזמנה הנוכחית)
      const overlappingBookings = await Booking.find({
        _id: { $ne: req.params.id },
        room: roomId || booking.room,
        $or: [
          { 
            checkIn: { $lte: checkInDate },
            checkOut: { $gt: checkInDate }
          },
          { 
            checkIn: { $lt: checkOutDate },
            checkOut: { $gte: checkOutDate }
          },
          { 
            checkIn: { $gte: checkInDate },
            checkOut: { $lte: checkOutDate }
          }
        ]
      });
      
      if (overlappingBookings.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'החדר אינו זמין בתאריכים המבוקשים' 
        });
      }
    }
    
    // חישוב מחיר כולל אם יש שינוי בתאריכים או בסטטוס תייר
    let totalPrice = booking.totalPrice;
    
    if (nights !== booking.nights || 
        (isTourist !== undefined && isTourist !== booking.isTourist)) {
      
      // חישוב מחיר בסיסי
      totalPrice = room.basePrice * nights;
      
      // הוספת מע"מ אם הלקוח אינו תייר
      if (isTourist !== undefined ? !isTourist : !booking.isTourist) {
        totalPrice = totalPrice * 1.17; // 17% מע"מ
      }
    }
    
    // עדכון פרטי ההזמנה
    booking.room = roomId || booking.room;
    
    if (guest) {
      booking.guest.name = guest.name || booking.guest.name;
      booking.guest.phone = guest.phone || booking.guest.phone;
      booking.guest.email = guest.email || booking.guest.email;
    }
    
    booking.checkIn = checkInDate;
    booking.checkOut = checkOutDate;
    booking.nights = nights;
    booking.totalPrice = totalPrice;
    
    if (isTourist !== undefined) {
      booking.isTourist = isTourist;
    }
    
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }
    
    if (paymentMethod) {
      booking.paymentMethod = paymentMethod;
    }
    
    if (creditCardDetails) {
      booking.creditCardDetails = {
        ...booking.creditCardDetails,
        ...creditCardDetails
      };
    }
    
    if (notes !== undefined) {
      booking.notes = notes;
    }
    
    // שמירת השינויים
    await booking.save();
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('שגיאה בעדכון הזמנה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    מחיקת הזמנה
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'ההזמנה לא נמצאה' 
      });
    }
    
    // מחיקת ההזמנה - שימוש בשיטה המומלצת בגרסאות עדכניות של Mongoose
    await Booking.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'ההזמנה נמחקה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה במחיקת הזמנה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
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