const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const roomController = require('../controllers/roomController');
const { protect, admin } = require('../middleware/auth');

// --- ניתובים עבור סנכרון יומנים חיצוניים ---

// @route   PUT /api/rooms/:id/ical
// @desc    עדכון כתובת iCal לחדר
// @access  Private/Admin
router.put(
  '/:id/ical',
  [
    protect,
    admin,
    [
      check('iCalUrl', 'נא לספק כתובת iCal תקינה').isURL()
    ]
  ],
  roomController.updateICalUrl
);

// @route   POST /api/rooms/:id/sync-ical
// @desc    סנכרון ידני של יומן iCal לחדר ספציפי
// @access  Private/Admin
router.post(
  '/:id/sync-ical',
  [protect, admin],
  roomController.syncICalForRoom
);

// @route   POST /api/rooms/sync-all-icals
// @desc    סנכרון ידני של כל יומני ה-iCal
// @access  Private/Admin
router.post(
  '/sync-all-icals',
  [protect, admin],
  roomController.syncAllICals
);

// @route   DELETE /api/rooms/disable-all-ical-sync
// @desc    ניטרול כל הסנכרונים החיצוניים והסרת החסימות מבוקינג
// @access  Private/Admin
router.delete('/disable-all-ical-sync', [protect, admin], async (req, res) => {
  try {
    // ייבוא המודלים
    const BlockedDate = require('../models/BlockedDate');
    const Room = require('../models/Room');
    
    // מחיקת כל החסימות שקשורות למקורות חיצוניים
    let deleteBlockedDatesResult;
    try {
      deleteBlockedDatesResult = await BlockedDate.deleteMany({
        externalSource: { $in: ['booking.com', 'ical'] }
      });
    } catch (deleteError) {
      console.error('שגיאה במחיקת חסימות חיצוניות:', deleteError);
      deleteBlockedDatesResult = { deletedCount: 0 };
    }
    
    // אם עדיין יש בעיות, מאפשר גם למחוק את כל החסימות שאינן קשורות להזמנות מקומיות
    const forceDeleteAll = req.query.forceDeleteAll === 'true';
    
    if (forceDeleteAll) {
      // מחיקת כל החסימות שאינן קשורות להזמנות (שלא מתחילות ב-booking:)
      let deleteNonBookingBlockedDatesResult;
      try {
        deleteNonBookingBlockedDatesResult = await BlockedDate.deleteMany({
          $or: [
            { externalReference: { $exists: false } },
            { externalReference: '' },
            { externalReference: { $not: /^booking:/ } }
          ]
        });
      } catch (deleteError) {
        console.error('שגיאה במחיקת חסימות נוספות:', deleteError);
        deleteNonBookingBlockedDatesResult = { deletedCount: 0 };
      }
      
      // עדכון המונה של החסימות שנמחקו
      deleteBlockedDatesResult.deletedCount += deleteNonBookingBlockedDatesResult.deletedCount;
      
      console.log(`נמחקו ${deleteNonBookingBlockedDatesResult.deletedCount} חסימות נוספות (ללא מקור חיצוני)`);
    }
    
    // מנקה את שדות ה-iCalUrl ומועד הסנכרון האחרון בכל החדרים
    let updateRoomsResult;
    try {
      updateRoomsResult = await Room.updateMany(
        {}, // כל החדרים
        { 
          $set: { 
            iCalUrl: '', 
            lastSyncedAt: null 
          } 
        }
      );
    } catch (updateError) {
      console.error('שגיאה בעדכון החדרים:', updateError);
      updateRoomsResult = { modifiedCount: 0 };
    }
    
    res.json({
      success: true,
      message: `הסנכרון נוטרל בהצלחה. נמחקו ${deleteBlockedDatesResult.deletedCount} חסימות ו-${updateRoomsResult.modifiedCount} חדרים עודכנו`,
      deletedBlockedDates: deleteBlockedDatesResult.deletedCount,
      updatedRooms: updateRoomsResult.modifiedCount,
      forceDeleteAllApplied: forceDeleteAll
    });
  } catch (error) {
    console.error('שגיאה בניטרול הסנכרונים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת',
      error: error.message
    });
  }
});

// --- ניתובים עבור תאריכים חסומים ---

// @route   GET /api/rooms/blocked-dates
// @desc    קבלת כל התאריכים החסומים בטווח תאריכים
// @access  Public
router.get('/blocked-dates', roomController.getBlockedDates);

// @route   DELETE /api/rooms/blocked-dates/all
// @desc    מחיקת כל החסימות במערכת (לצורכי דיבאג)
// @access  Private/Admin
router.delete('/blocked-dates/all', [protect, admin], async (req, res) => {
  try {
    const BlockedDate = require('../models/BlockedDate');
    const result = await BlockedDate.deleteMany({});
    
    res.json({
      success: true,
      message: `נמחקו ${result.deletedCount} חסימות מהמערכת`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('שגיאה במחיקת כל החסימות:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

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

// @route   PUT /api/rooms/blocked-dates/:id/guest-details
// @desc    עדכון פרטי אורח בחסימה מבוקינג
// @access  Private/Admin
router.put('/blocked-dates/:id/guest-details', [protect, admin], roomController.updateBlockedDateGuestDetails);

// @route   POST /api/rooms/check-availability
// @desc    בדיקת זמינות חדר
// @access  Public
router.post('/check-availability', roomController.checkAvailability);

// @route   GET /api/rooms
// @desc    קבלת כל החדרים
// @access  Public
router.get('/', roomController.getRooms);

// בואו נוסיף נתיב ייעודי נוסף לדשבורד המנהלים
// @route   GET /api/rooms/admin/all
// @desc    קבלת כל החדרים למנהלים
// @access  Private/Admin
router.get('/admin/all', [protect, admin], roomController.getRooms);

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