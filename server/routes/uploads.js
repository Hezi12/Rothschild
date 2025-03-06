const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Room = require('../models/Room');
const { protect, admin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// יוצר את תיקיית ההעלאות אם היא לא קיימת
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// הגדרת אחסון זמני עם multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
  }
});

// סינון קבצים (רק תמונות)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('ניתן להעלות רק קבצי תמונה'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// @route   POST /api/uploads/room/:roomId
// @desc    העלאת תמונה לחדר
// @access  Private/Admin
router.post('/room/:roomId', [protect, admin, upload.single('image')], async (req, res) => {
  try {
    const roomId = req.params.roomId;
    
    // בדיקה אם החדר קיים
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    // אם אין קובץ
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'נא להעלות קובץ תמונה' 
      });
    }
    
    // העלאה ל-Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'rothschild79/rooms',
      use_filename: true
    });
    
    // הוספת התמונה לחדר
    room.images.push({
      url: result.secure_url,
      publicId: result.public_id
    });
    
    // שמירת השינויים
    await room.save();
    
    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('שגיאה בהעלאת תמונה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

// @route   DELETE /api/uploads/room/:roomId/:imageId
// @desc    מחיקת תמונה מחדר
// @access  Private/Admin
router.delete('/room/:roomId/:imageId', [protect, admin], async (req, res) => {
  try {
    const { roomId, imageId } = req.params;
    
    // בדיקה אם החדר קיים
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'החדר לא נמצא' 
      });
    }
    
    // מציאת התמונה
    const imageIndex = room.images.findIndex(img => img._id.toString() === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'התמונה לא נמצאה' 
      });
    }
    
    const image = room.images[imageIndex];
    
    // מחיקה מ-Cloudinary
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
    
    // הסרת התמונה מהחדר
    room.images.splice(imageIndex, 1);
    
    // שמירת השינויים
    await room.save();
    
    res.json({
      success: true,
      message: 'התמונה נמחקה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה במחיקת תמונה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

module.exports = router; 