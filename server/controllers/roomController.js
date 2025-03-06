const Room = require('../models/Room');
const Booking = require('../models/Booking');
const cloudinary = require('../config/cloudinary');
const { validationResult } = require('express-validator');

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
    await room.remove();
    
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
  const { roomId, checkIn, checkOut } = req.body;

  // וידוא שהתאריכים תקינים
  if (!checkIn || !checkOut || new Date(checkIn) >= new Date(checkOut)) {
    return res.status(400).json({ 
      success: false, 
      message: 'תאריכי צ\'ק-אין וצ\'ק-אאוט אינם תקינים' 
    });
  }

  try {
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
    
    res.json({
      success: true,
      isAvailable,
      room: {
        id: room._id,
        roomNumber: room.roomNumber,
        basePrice: room.basePrice
      }
    });
  } catch (error) {
    console.error('שגיאה בבדיקת זמינות:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
}; 