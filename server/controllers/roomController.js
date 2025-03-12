const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

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
  
  const {
    roomNumber,
    type,
    description,
    basePrice,
    maxOccupancy,
    amenities,
    images,
    isActive
  } = req.body;
  
  try {
    // בדיקה אם כבר קיים חדר עם אותו מספר
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `חדר עם מספר ${roomNumber} כבר קיים במערכת`
      });
    }
    
    // יצירת חדר חדש
    const room = new Room({
      roomNumber,
      type,
      description,
      basePrice,
      maxOccupancy,
      amenities,
      images,
      isActive: isActive !== undefined ? isActive : true
    });
    
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
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    // אם מספר החדר השתנה, בדוק שאין חדר עם המספר החדש
    if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ roomNumber: req.body.roomNumber });
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: `חדר עם מספר ${req.body.roomNumber} כבר קיים במערכת`
        });
      }
    }
    
    // עדכון הנתונים
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: updatedRoom
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
    
    // בדיקה אם יש הזמנות עתידיות לחדר זה
    const futureBookings = await Booking.find({
      room: req.params.id,
      checkOut: { $gte: new Date() },
      status: { $ne: 'canceled' }
    });
    
    if (futureBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'לא ניתן למחוק את החדר כיוון שיש לו הזמנות עתידיות'
      });
    }
    
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

// @desc    בדיקת זמינות חדרים
// @route   POST /api/rooms/check-availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, guests } = req.body;
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'יש לספק תאריכי הגעה ועזיבה'
      });
    }
    
    // המרת התאריכים לאובייקטי תאריך וקביעת שעות לחצות (00:00)
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    
    // אם סופק חדר ספציפי לבדיקה
    if (roomId) {
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
        status: { $ne: 'canceled' },
        $or: [
          // צ'ק-אין בתוך תקופת הזמנה קיימת
          { 
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
          }
        ]
      });
      
      // אם יש הזמנות חופפות, החדר לא זמין
      if (overlappingBookings.length > 0) {
        return res.json({
          success: true,
          isAvailable: false,
          reason: 'קיימת הזמנה בתאריכים אלה',
          room: {
            id: room._id,
            roomNumber: room.roomNumber,
            basePrice: room.basePrice
          }
        });
      }
      
      // אם אין הזמנות חופפות, החדר זמין
      return res.json({
        success: true,
        isAvailable: true,
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
          status: { $ne: 'canceled' },
          $or: [
            { 
              checkIn: { $lt: checkOutDate },
              checkOut: { $gt: checkInDate }
            }
          ]
        });
        
        // אם אין הזמנות חופפות, החדר זמין
        if (overlappingBookings.length === 0) {
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

// @desc    עדכון מחירים מיוחדים לפי ימי שבוע לחדר ספציפי
// @route   PUT /api/rooms/:id/special-prices
// @access  Private/Admin
exports.updateRoomSpecialPrices = async (req, res) => {
  try {
    const roomId = req.params.id;
    const { specialPrices } = req.body;

    // וידוא שהחדר קיים
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר לא נמצא'
      });
    }

    // עדכון מחירים מיוחדים
    if (!room.specialPrices) {
      room.specialPrices = {};
    }

    // עדכון או יצירה של מחירים מיוחדים לפי ימי שבוע
    for (const [day, priceInfo] of Object.entries(specialPrices)) {
      if (priceInfo.enabled && priceInfo.price > 0) {
        room.specialPrices[day] = priceInfo.price;
      } else {
        delete room.specialPrices[day];
      }
    }

    await room.save();

    res.json({
      success: true,
      specialPrices: room.specialPrices,
      message: 'המחירים המיוחדים עודכנו בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה בעדכון מחירים מיוחדים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    קבלת מחירים מיוחדים לפי ימי שבוע לחדר ספציפי
// @route   GET /api/rooms/:id/special-prices
// @access  Private/Admin
exports.getRoomSpecialPrices = async (req, res) => {
  try {
    const roomId = req.params.id;

    // וידוא שהחדר קיים
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר לא נמצא'
      });
    }

    res.json({
      success: true,
      specialPrices: room.specialPrices || {}
    });
  } catch (error) {
    console.error('שגיאה בקבלת מחירים מיוחדים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
}; 