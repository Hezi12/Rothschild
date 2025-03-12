const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const roomController = require('../controllers/roomController');
const { protect, admin } = require('../middleware/auth');
const Room = require('../models/Room');

// --- ניתובים עבור חדרים ---

// @route   GET /api/rooms
// @desc    קבלת כל החדרים
// @access  Public
router.get('/', roomController.getRooms);

// @route   POST /api/rooms/check-availability
// @desc    בדיקת זמינות חדרים
// @access  Public
router.post('/check-availability', roomController.checkAvailability);

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
      check('roomNumber', 'יש לספק מספר חדר').not().isEmpty(),
      check('type', 'יש לספק סוג חדר').not().isEmpty(),
      check('basePrice', 'יש לספק מחיר בסיס').isNumeric(),
      check('maxOccupancy', 'יש לספק מספר אורחים מרבי').isNumeric(),
      check('description', 'יש לספק תיאור חדר').not().isEmpty()
    ]
  ],
  roomController.createRoom
);

// @route   PUT /api/rooms/:id
// @desc    עדכון חדר
// @access  Private/Admin
router.put('/:id', [protect, admin], roomController.updateRoom);

// @route   DELETE /api/rooms/:id
// @desc    מחיקת חדר
// @access  Private/Admin
router.delete('/:id', [protect, admin], roomController.deleteRoom);

// נתיבים למחירים מיוחדים לפי ימי שבוע
router.route('/:id/special-prices')
  .get(protect, admin, roomController.getRoomSpecialPrices)
  .put(protect, admin, roomController.updateRoomSpecialPrices);

module.exports = router; 