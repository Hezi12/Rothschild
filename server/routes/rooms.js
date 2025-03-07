const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const roomController = require('../controllers/roomController');
const { protect, admin } = require('../middleware/auth');

// --- ניתובים עבור תאריכים חסומים ---

// @route   GET /api/rooms/blocked-dates
// @desc    קבלת כל התאריכים החסומים בטווח תאריכים
// @access  Public
router.get('/blocked-dates', roomController.getBlockedDates);

// @route   POST /api/rooms/block-dates
// @desc    חסימת תאריכים לחדר
// @access  Private/Admin
router.post(
  '/block-dates',
  [
    protect,
    admin,
    [
      check('roomId', 'נא לספק מזהה חדר').not().isEmpty(),
      check('startDate', 'נא לספק תאריך התחלה תקין').isISO8601(),
      check('endDate', 'נא לספק תאריך סיום תקין').isISO8601()
    ]
  ],
  roomController.blockDates
);

// @route   DELETE /api/rooms/blocked-dates/:id
// @desc    הסרת חסימת תאריכים
// @access  Private/Admin
router.delete('/blocked-dates/:id', [protect, admin], roomController.unblockDates);

// @route   POST /api/rooms/check-availability
// @desc    בדיקת זמינות חדר
// @access  Public
router.post('/check-availability', roomController.checkAvailability);

// @route   GET /api/rooms
// @desc    קבלת כל החדרים
// @access  Public
router.get('/', roomController.getRooms);

// @route   GET /api/rooms/:id
// @desc    קבלת חדר לפי מזהה
// @access  Public
router.get('/:id', roomController.getRoom);

// @route   POST /api/rooms
// @desc    יצירת חדר חדש
// @access  Private/Admin
router.post(
  '/',
  [
    protect,
    admin,
    [
      check('roomNumber', 'נא להזין מספר חדר').isNumeric(),
      check('type', 'נא להזין סוג חדר').not().isEmpty(),
      check('basePrice', 'נא להזין מחיר בסיס').isNumeric(),
      check('maxOccupancy', 'נא להזין תפוסה מקסימלית').isNumeric(),
      check('description', 'נא להזין תיאור').not().isEmpty()
    ]
  ],
  roomController.createRoom
);

// @route   PUT /api/rooms/:id
// @desc    עדכון חדר
// @access  Private/Admin
router.put(
  '/:id',
  [
    protect,
    admin,
    [
      check('roomNumber', 'מספר חדר חייב להיות מספר').optional().isNumeric(),
      check('basePrice', 'מחיר בסיס חייב להיות מספר').optional().isNumeric(),
      check('maxOccupancy', 'תפוסה מקסימלית חייבת להיות מספר').optional().isNumeric()
    ]
  ],
  roomController.updateRoom
);

// @route   DELETE /api/rooms/:id
// @desc    מחיקת חדר
// @access  Private/Admin
router.delete('/:id', [protect, admin], roomController.deleteRoom);

module.exports = router; 