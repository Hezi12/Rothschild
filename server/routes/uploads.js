const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Room = require('../models/Room');
const Gallery = require('../models/Gallery');
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
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// @route   POST /api/uploads/room/:roomId
// @desc    העלאת תמונה או תמונות לחדר
// @access  Private/Admin
router.post('/room/:roomId', [protect, admin, upload.array('images', 10)], async (req, res) => {
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
    
    // אם אין קבצים
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'נא להעלות לפחות קובץ תמונה אחד' 
      });
    }
    
    const uploadedImages = [];
    const isFirstUpload = room.images.length === 0;
    
    // העלאת כל התמונות ל-Cloudinary
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'rothschild79/rooms',
        use_filename: true
      });
      
      // הוספת התמונה לחדר
      const newImage = {
        url: result.secure_url,
        publicId: result.public_id,
        isPrimary: isFirstUpload && i === 0 // התמונה הראשונה תהיה ראשית אם אין עדיין תמונות
      };
      
      room.images.push(newImage);
      uploadedImages.push({
        _id: room.images[room.images.length - 1]._id,
        url: result.secure_url,
        publicId: result.public_id,
        isPrimary: newImage.isPrimary
      });
      
      // מחיקת הקובץ הזמני
      fs.unlink(file.path, (err) => {
        if (err) console.error('שגיאה במחיקת קובץ זמני:', err);
      });
    }
    
    // שמירת השינויים
    await room.save();
    
    res.json({
      success: true,
      message: `${req.files.length} תמונות הועלו בהצלחה`,
      data: uploadedImages
    });
  } catch (error) {
    console.error('שגיאה בהעלאת תמונות:', error);
    // מחיקת כל הקבצים הזמניים גם במקרה של שגיאה
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('שגיאה במחיקת קובץ זמני:', err);
        });
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

// @route   POST /api/uploads/gallery
// @desc    העלאת תמונה לגלריה הכללית
// @access  Private/Admin
router.post('/gallery', [protect, admin, upload.single('image')], async (req, res) => {
  try {
    // בדיקת קובץ
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'נא להעלות קובץ תמונה' 
      });
    }
    
    // קבלת או יצירת הגלריה
    let gallery = await Gallery.findOne();
    if (!gallery) {
      gallery = new Gallery();
      await gallery.save();
    }
    
    // העלאה ל-Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'rothschild79/gallery',
      use_filename: true
    });
    
    // מציאת הסדר הגבוה ביותר הקיים בתמונות
    const maxOrder = gallery.images.length > 0 
      ? Math.max(...gallery.images.map(img => img.order)) 
      : -1;
    
    // הוספת התמונה לגלריה
    const newImage = {
      url: result.secure_url,
      publicId: result.public_id,
      title: req.body.title || '',
      order: maxOrder + 1,
      isActive: true
    };
    
    gallery.images.push(newImage);
    
    // שמירת השינויים
    await gallery.save();
    
    // מחיקת הקובץ הזמני - הועבר לכאן במקום בבלוק finally
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('שגיאה במחיקת קובץ זמני:', err);
      });
    }
    
    res.json({
      success: true,
      data: gallery.images[gallery.images.length - 1]
    });
  } catch (error) {
    console.error('שגיאה בהעלאת תמונה לגלריה:', error);
    // מחיקת הקובץ הזמני גם במקרה של שגיאה
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('שגיאה במחיקת קובץ זמני:', err);
      });
    }
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

// @route   PUT /api/uploads/room/:roomId/:imageId/primary
// @desc    הגדרת תמונה כתמונה ראשית
// @access  Private/Admin
router.put('/room/:roomId/:imageId/primary', [protect, admin], async (req, res) => {
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
    
    // איפוס כל התמונות כך שאף אחת לא תהיה ראשית
    room.images.forEach(image => {
      image.isPrimary = false;
    });
    
    // מציאת התמונה הרצויה והגדרתה כראשית
    const imageIndex = room.images.findIndex(img => img._id.toString() === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'התמונה לא נמצאה' 
      });
    }
    
    room.images[imageIndex].isPrimary = true;
    
    // שמירת השינויים
    await room.save();
    
    res.json({
      success: true,
      message: 'התמונה הוגדרה כתמונה ראשית בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה בהגדרת תמונה ראשית:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

module.exports = router; 