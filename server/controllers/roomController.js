const Room = require('../models/Room');
const Booking = require('../models/Booking');
const BlockedDate = require('../models/BlockedDate');
const cloudinary = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const icalService = require('../utils/ical/icalService');

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

  const { roomNumber, type, basePrice, maxOccupancy, description, amenities } = req.body;

  try {
    // בדיקה אם כבר קיים חדר עם אותו מספר
    const existingRoom = await Room.findOne({ roomNumber });
    
    if (existingRoom) {
      return res.status(400).json({ 
        success: false, 
        message: 'חדר עם מספר זה כבר קיים' 
      });
    }
    
    // יצירת חדר חדש
    const room = new Room({
      roomNumber,
      type,
      basePrice,
      maxOccupancy,
      description,
      amenities: amenities || [],
      images: []
    });
    
    // שמירת החדר במסד הנתונים
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { roomNumber, type, basePrice, maxOccupancy, description, amenities, isActive } = req.body;

  try {
    let room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    // בדיקה אם מספר החדר החדש כבר קיים (אם שונה מהמקורי)
    if (roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ roomNumber });
      
      if (existingRoom) {
        return res.status(400).json({ 
          success: false, 
          message: 'חדר עם מספר זה כבר קיים' 
        });
      }
    }
    
    // עדכון פרטי החדר
    room.roomNumber = roomNumber || room.roomNumber;
    room.type = type || room.type;
    room.basePrice = basePrice || room.basePrice;
    room.maxOccupancy = maxOccupancy || room.maxOccupancy;
    room.description = description || room.description;
    room.amenities = amenities || room.amenities;
    
    if (isActive !== undefined) {
      room.isActive = isActive;
    }
    
    // שמירת השינויים
    await room.save();
    
    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('שגיאה בעדכון חדר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
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
    
    // בדיקה אם יש הזמנות פעילות לחדר זה
    const activeBookings = await Booking.find({
      room: room._id,
      checkOut: { $gte: new Date() }
    });
    
    if (activeBookings.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'לא ניתן למחוק חדר עם הזמנות פעילות' 
      });
    }
    
    // מחיקת תמונות מ-Cloudinary
    for (const image of room.images) {
      if (image.publicId) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }
    
    // מחיקת החדר
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

// @desc    בדיקת זמינות חדר
// @route   POST /api/rooms/check-availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  const { roomId, checkIn, checkOut, guests, rooms } = req.body;

  // וידוא שהתאריכים תקינים
  if (!checkIn || !checkOut || new Date(checkIn) >= new Date(checkOut)) {
    return res.status(400).json({ 
      success: false, 
      message: 'תאריכי צ\'ק-אין וצ\'ק-אאוט אינם תקינים' 
    });
  }

  try {
    // אם סופק מזהה חדר ספציפי, בדוק את הזמינות שלו
    if (roomId) {
      // בדיקה אם החדר קיים
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
        $or: [
          // צ'ק-אין בתוך תקופת הזמנה קיימת
          { 
            checkIn: { $lte: new Date(checkIn) },
            checkOut: { $gt: new Date(checkIn) }
          },
          // צ'ק-אאוט בתוך תקופת הזמנה קיימת
          { 
            checkIn: { $lt: new Date(checkOut) },
            checkOut: { $gte: new Date(checkOut) }
          },
          // תקופת ההזמנה מכילה הזמנה קיימת
          { 
            checkIn: { $gte: new Date(checkIn) },
            checkOut: { $lte: new Date(checkOut) }
          }
        ]
      });
      
      const isAvailable = overlappingBookings.length === 0;
      
      return res.json({
        success: true,
        isAvailable,
        room: {
          id: room._id,
          roomNumber: room.roomNumber,
          basePrice: room.basePrice
        }
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
          $or: [
            { 
              checkIn: { $lte: new Date(checkIn) },
              checkOut: { $gt: new Date(checkIn) }
            },
            { 
              checkIn: { $lt: new Date(checkOut) },
              checkOut: { $gte: new Date(checkOut) }
            },
            { 
              checkIn: { $gte: new Date(checkIn) },
              checkOut: { $lte: new Date(checkOut) }
            }
          ]
        });

        // בדיקה אם יש תאריכים חסומים חופפים
        const overlappingBlockedDates = await BlockedDate.find({
          room: room._id,
          $or: [
            { 
              startDate: { $lte: new Date(checkIn) },
              endDate: { $gt: new Date(checkIn) }
            },
            { 
              startDate: { $lt: new Date(checkOut) },
              endDate: { $gte: new Date(checkOut) }
            },
            { 
              startDate: { $gte: new Date(checkIn) },
              endDate: { $lte: new Date(checkOut) }
            }
          ]
        });
        
        // אם אין הזמנות או תאריכים חסומים, הוסף לרשימת החדרים הזמינים
        if (overlappingBookings.length === 0 && overlappingBlockedDates.length === 0) {
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

// --- פונקציות לניהול תאריכים חסומים ---

// @desc    קבלת תאריכים חסומים בטווח מסוים
// @route   GET /api/rooms/blocked-dates
// @access  Public
exports.getBlockedDates = async (req, res) => {
  const { startDate, endDate, roomId } = req.query;
  
  try {
    let query = {};
    
    // אם סופקו תאריכים, מסננים לפי טווח
    if (startDate && endDate) {
      try {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        // וידוא שהתאריכים תקינים
        if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
          query = {
            $or: [
              // חסימה שמתחילה בטווח
              { 
                startDate: { 
                  $gte: startDateObj,
                  $lt: endDateObj
                }
              },
              // חסימה שמסתיימת בטווח
              { 
                endDate: { 
                  $gt: startDateObj,
                  $lte: endDateObj
                }
              },
              // חסימה שמכילה את כל הטווח
              {
                startDate: { $lte: startDateObj },
                endDate: { $gte: endDateObj }
              }
            ]
          };
        }
      } catch (err) {
        console.error('שגיאה בפרסור תאריכים:', err);
      }
    }
    
    // אם סופק מזהה חדר ספציפי
    if (roomId) {
      query.room = roomId;
    }
    
    // מביא את כל החסימות ועושה populate לנתוני החדר
    const blockedDates = await BlockedDate.find(query)
      .populate('room', 'roomNumber type')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      count: blockedDates.length,
      data: blockedDates
    });
  } catch (error) {
    console.error('שגיאה בקבלת תאריכים חסומים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת',
      error: error.message 
    });
  }
};

// @desc    חסימת תאריכים לחדר
// @route   POST /api/rooms/block-dates
// @access  Private/Admin
exports.blockDates = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { roomId, startDate, endDate, reason } = req.body;

  try {
    // בדיקה שהחדר קיים
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    // וידוא שתאריך הסיום מאוחר מתאריך ההתחלה
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ 
        success: false, 
        message: 'תאריך הסיום חייב להיות מאוחר מתאריך ההתחלה' 
      });
    }
    
    // בדיקה אם יש הזמנות חופפות בטווח התאריכים
    const overlappingBookings = await Booking.find({
      room: roomId,
      $or: [
        // צ'ק-אין בתוך תקופת החסימה
        { 
          checkIn: { $gte: new Date(startDate), $lt: new Date(endDate) }
        },
        // צ'ק-אאוט בתוך תקופת החסימה
        { 
          checkOut: { $gt: new Date(startDate), $lte: new Date(endDate) }
        },
        // טווח ההזמנה מכיל את החסימה
        {
          checkIn: { $lte: new Date(startDate) },
          checkOut: { $gte: new Date(endDate) }
        }
      ],
      // לא כולל הזמנות מבוטלות
      paymentStatus: { $ne: 'בוטל' }
    });
    
    if (overlappingBookings.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'קיימות הזמנות בטווח התאריכים שנבחרו' 
      });
    }
    
    // יצירת רשומת תאריך חסום חדשה
    const blockedDate = new BlockedDate({
      room: roomId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || '',
      createdBy: req.user._id
    });
    
    await blockedDate.save();
    
    res.status(201).json({
      success: true,
      data: blockedDate
    });
  } catch (error) {
    console.error('שגיאה בחסימת תאריכים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    הסרת חסימת תאריכים
// @route   DELETE /api/rooms/blocked-dates/:id
// @access  Private/Admin
exports.unblockDates = async (req, res) => {
  try {
    const blockedDate = await BlockedDate.findById(req.params.id);
    
    if (!blockedDate) {
      return res.status(404).json({ 
        success: false, 
        message: 'רשומת תאריך חסום לא נמצאה' 
      });
    }
    
    await blockedDate.deleteOne();
    
    res.json({
      success: true,
      message: 'חסימת התאריך הוסרה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה בהסרת חסימת תאריכים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    עדכון פרטי אורח בחסימה מבוקינג
// @route   PUT /api/rooms/blocked-dates/:id/guest-details
// @access  Private/Admin
exports.updateBlockedDateGuestDetails = async (req, res) => {
  try {
    const { guestDetails } = req.body;
    
    if (!guestDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'חסרים פרטי אורח' 
      });
    }
    
    // מציאת רשומת החסימה
    const blockedDate = await BlockedDate.findById(req.params.id);
    
    if (!blockedDate) {
      return res.status(404).json({ 
        success: false, 
        message: 'רשומת תאריך חסום לא נמצאה' 
      });
    }
    
    // וידוא שזו חסימה מבוקינג
    if (blockedDate.externalSource !== 'booking.com') {
      return res.status(400).json({ 
        success: false, 
        message: 'רק חסימות מבוקינג ניתנות לעדכון פרטי אורח' 
      });
    }
    
    // עדכון פרטי האורח
    blockedDate.guestDetails = guestDetails;
    
    // שמירת השינויים
    await blockedDate.save();
    
    res.json({
      success: true,
      message: 'פרטי האורח עודכנו בהצלחה',
      data: blockedDate
    });
  } catch (error) {
    console.error('שגיאה בעדכון פרטי אורח בחסימה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת',
      error: error.message
    });
  }
};

// @desc    עדכון כתובת iCal לחדר
// @route   PUT /api/rooms/:id/ical
// @access  Private/Admin
exports.updateICalUrl = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { iCalUrl } = req.body;

  try {
    // בדיקה שהחדר קיים
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    // עדכון כתובת ה-iCal
    room.iCalUrl = iCalUrl;
    await room.save();
    
    // אם הכתובת ריקה, מחזירים הודעת הצלחה
    if (!iCalUrl) {
      return res.json({
        success: true,
        message: 'כתובת ה-iCal נמחקה בהצלחה',
        data: room
      });
    }
    
    // ניסיון לסנכרן מיד
    try {
      const syncResult = await icalService.syncRoomBookings(room._id);
      
      res.json({
        success: true,
        message: 'כתובת ה-iCal עודכנה וסונכרנה בהצלחה',
        data: room,
        syncResult
      });
    } catch (syncError) {
      // אם יש שגיאת סנכרון, עדיין מחזירים הצלחה, אבל עם הודעת שגיאה
      console.error('שגיאה בסנכרון ראשוני של ה-iCal:', syncError);
      
      res.json({
        success: true,
        message: 'כתובת ה-iCal עודכנה, אך הסנכרון הראשוני נכשל',
        data: room,
        syncError: syncError.message
      });
    }
  } catch (error) {
    console.error('שגיאה בעדכון כתובת ה-iCal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת',
      error: error.message
    });
  }
};

// @desc    סנכרון ידני של יומן iCal לחדר ספציפי
// @route   POST /api/rooms/:id/sync-ical
// @access  Private/Admin
exports.syncICalForRoom = async (req, res) => {
  try {
    // בדיקה שהחדר קיים
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    if (!room.iCalUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'לחדר זה אין כתובת iCal מוגדרת' 
      });
    }
    
    // ביצוע הסנכרון
    const result = await icalService.syncRoomBookings(room._id);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    console.error('שגיאה בסנכרון יומן ה-iCal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת',
      error: error.message
    });
  }
};

// @desc    סנכרון ידני של כל יומני ה-iCal
// @route   POST /api/rooms/sync-all-icals
// @access  Private/Admin
exports.syncAllICals = async (req, res) => {
  try {
    // ביצוע הסנכרון לכל החדרים
    const result = await icalService.syncAllRooms();
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    console.error('שגיאה בסנכרון כל יומני ה-iCal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת',
      error: error.message
    });
  }
}; 