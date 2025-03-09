const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');
const Booking = require('../models/Booking');

// @route   GET /api/bookings
// @desc    Get all bookings
// @access  Private/Admin
router.get('/', [protect, admin], bookingController.getAllBookings);

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

// נתיב לאימות קיום הזמנה
router.get('/validate', async (req, res) => {
  try {
    const { bookingId, email } = req.query;
    
    if (!bookingId || !email) {
      return res.status(400).json({ error: 'חסרים פרטים נדרשים' });
    }
    
    // בדיקת האם ההזמנה קיימת עם האימייל הנכון
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.json({ valid: false });
    }
    
    // בדיקת התאמת האימייל
    const isValid = booking.guest.email.toLowerCase() === email.toLowerCase();
    
    return res.json({ valid: isValid });
  } catch (error) {
    console.error('שגיאה באימות הזמנה:', error);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router; 