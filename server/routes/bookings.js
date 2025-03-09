const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/bookings
// @desc    קבלת כל ההזמנות
// @access  Private/Admin
router.get('/', [protect, admin], bookingController.getBookings);

// @route   GET /api/bookings/:id
// @desc    קבלת הזמנה לפי מזהה
// @access  Private/Admin
router.get('/:id', [protect, admin], bookingController.getBooking);

// @route   GET /api/bookings/public/:id
// @desc    קבלת פרטי הזמנה ספציפית ללא הגנה (לצורך ניהול הזמנה על ידי לקוח)
// @access  Public
router.get('/public/:id', bookingController.getPublicBooking);

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

// @route   POST /api/bookings/:id/cancel
// @desc    ביטול הזמנה
// @access  Public
router.post('/:id/cancel', bookingController.cancelBooking);

module.exports = router; 