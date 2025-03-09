const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');
const Booking = require('../models/Booking');
const { sendCancellationAlert } = require('../utils/emailService');

// @route   GET /api/bookings
// @desc    קבלת כל ההזמנות
// @access  Private/Admin
router.get('/', [protect, admin], bookingController.getBookings);

// @route   GET /api/bookings/:id
// @desc    קבלת הזמנה לפי מזהה
// @access  Private/Admin
router.get('/:id', [protect, admin], bookingController.getBooking);

// @route   POST /api/bookings
// @desc    יצירת הזמנה חדשה
// @access  Public
router.post(
  '/',
  [
    check('roomId', 'נא לבחור חדר').not().isEmpty(),
    check('guest.name', 'נא להזין שם אורח').not().isEmpty(),
    check('guest.phone', 'נא להזין מספר טלפון').not().isEmpty(),
    check('guest.email', 'נא להזין כתובת אימייל תקינה').isEmail(),
    check('checkIn', 'נא להזין תאריך צ\'ק-אין').not().isEmpty(),
    check('checkOut', 'נא להזין תאריך צ\'ק-אאוט').not().isEmpty()
  ],
  bookingController.createBooking
);

// @route   PUT /api/bookings/:id
// @desc    עדכון הזמנה
// @access  Private/Admin
router.put(
  '/:id',
  [
    protect,
    admin,
    [
      check('guest.email', 'כתובת אימייל אינה תקינה').optional().isEmail()
    ]
  ],
  bookingController.updateBooking
);

// @route   DELETE /api/bookings/:id
// @desc    מחיקת הזמנה
// @access  Private/Admin
router.delete('/:id', [protect, admin], bookingController.deleteBooking);

// @route   GET /api/bookings/room/:roomId
// @desc    קבלת כל ההזמנות לחדר מסוים
// @access  Private/Admin
router.get('/room/:roomId', [protect, admin], bookingController.getRoomBookings);

// @route   GET /api/bookings/cancel-request/:id
// @desc    עמוד בקשת ביטול הזמנה
// @access  Public
router.get('/cancel-request/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'roomNumber type basePrice');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'ההזמנה לא נמצאה' 
      });
    }
    
    // חישוב הפרש הימים בין היום לתאריך הצ'ק-אין
    const today = new Date();
    today.setHours(0, 0, 0, 0); // איפוס שעות
    
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(0, 0, 0, 0); // איפוס שעות
    
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // קביעת סטטוס הביטול לפי מדיניות החברה
    const cancellationStatus = {
      isFree: diffDays >= 3,
      daysUntilCheckIn: diffDays,
      fee: diffDays >= 3 ? 0 : booking.totalPrice
    };
    
    res.json({
      success: true,
      data: {
        booking,
        cancellationStatus
      }
    });
  } catch (error) {
    console.error('שגיאה בבקשת ביטול:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

// @route   POST /api/bookings/cancel-request/:id
// @desc    שליחת בקשת ביטול הזמנה
// @access  Public
router.post('/cancel-request/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'roomNumber type');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'ההזמנה לא נמצאה' 
      });
    }
    
    // חישוב הפרש הימים בין היום לתאריך הצ'ק-אין
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // האם חינם או בתשלום
    const isFree = diffDays >= 3;
    const cancellationFee = isFree ? 0 : booking.totalPrice;
    
    // פרטי הביטול
    const cancellationDetails = {
      isFree,
      fee: cancellationFee,
      daysUntilCheckIn: diffDays
    };
    
    // שליחת מייל למנהל על בקשת הביטול
    try {
      await sendCancellationAlert(booking, cancellationDetails);
      console.log('נשלחה התראת ביטול למנהל');
    } catch (error) {
      console.error('שגיאה בשליחת התראת ביטול למנהל:', error);
      // ממשיכים למרות שגיאה בשליחת האימייל
    }
    
    res.json({
      success: true,
      message: 'בקשת הביטול התקבלה בהצלחה',
      data: {
        isFree,
        cancellationFee,
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber
      }
    });
  } catch (error) {
    console.error('שגיאה בשליחת בקשת ביטול:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

module.exports = router; 