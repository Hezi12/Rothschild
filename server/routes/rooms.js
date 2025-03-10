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

// @route   GET /api/rooms/check-availability
// @desc    בדיקת זמינות חדרים
// @access  Public
router.get('/check-availability', roomController.checkAvailability);

// --- ניתובים עבור חסימות תאריכים ---

// @route   GET /api/rooms/blocked-dates
// @desc    קבלת תאריכים חסומים
// @access  Public
router.get('/blocked-dates', roomController.getBlockedDates);

// @route   POST /api/rooms/blocked-dates
// @desc    חסימת תאריכים
// @access  Private/Admin
router.post(
  '/blocked-dates',
  [
    protect,
    admin,
    [
      check('roomId', 'יש לספק מזהה חדר').not().isEmpty(),
      check('startDate', 'יש לספק תאריך התחלה').isISO8601(),
      check('endDate', 'יש לספק תאריך סיום').isISO8601()
    ]
  ],
  roomController.blockDates
);

// @route   DELETE /api/rooms/blocked-dates/:id
// @desc    ביטול חסימת תאריכים
// @access  Private/Admin
router.delete('/blocked-dates/:id', [protect, admin], roomController.unblockDates);

// --- ניתובים עבור מחיקות מרובות ---

// @route   DELETE /api/rooms/blocked-dates/all
// @desc    מחיקת כל התאריכים החסומים
// @access  Private/Admin
router.delete('/blocked-dates/all', [protect, admin], async (req, res) => {
  try {
    // ייבוא המודל
    const BlockedDate = require('../models/BlockedDate');
    
    // מחיקת כל החסימות
    const result = await BlockedDate.deleteMany({});
    
    res.json({
      success: true,
      message: `נמחקו ${result.deletedCount} חסימות בהצלחה`,
      count: result.deletedCount
    });
  } catch (error) {
    console.error('שגיאה במחיקת כל החסימות:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת',
      error: error.message 
    });
  }
});

// @route   DELETE /api/rooms/:id/blocked-dates
// @desc    מחיקת כל החסימות לחדר מסוים
// @access  Private/Admin
router.delete('/:id/blocked-dates', [protect, admin], async (req, res) => {
  try {
    // ייבוא המודל
    const BlockedDate = require('../models/BlockedDate');
    
    // מחיקת כל החסימות של החדר הספציפי
    const result = await BlockedDate.deleteMany({ room: req.params.id });
    
    res.json({
      success: true,
      message: `נמחקו ${result.deletedCount} חסימות בהצלחה`,
      count: result.deletedCount
    });
  } catch (error) {
    console.error(`שגיאה במחיקת החסימות לחדר ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת',
      error: error.message 
    });
  }
});

module.exports = router; 