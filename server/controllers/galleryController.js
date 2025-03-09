const Gallery = require('../models/Gallery');
const cloudinary = require('../config/cloudinary');
const { validationResult } = require('express-validator');

// @desc    יצירת גלריה חדשה - במידה ולא קיימת
// @route   POST /api/gallery
// @access  Private/Admin
exports.createGallery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // בדיקה אם כבר קיימת גלריה
    let gallery = await Gallery.findOne();

    // אם אין גלריה, יוצרים גלריה חדשה
    if (!gallery) {
      gallery = new Gallery({
        name: req.body.name || 'גלריה כללית',
        description: req.body.description || 'תמונות כלליות שיוצגו בדף הבית'
      });

      await gallery.save();
    }

    res.status(201).json({
      success: true,
      data: gallery
    });
  } catch (error) {
    console.error('שגיאה ביצירת גלריה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    קבלת כל תמונות הגלריה הכללית
// @route   GET /api/gallery
// @access  Public
exports.getGallery = async (req, res) => {
  try {
    // מחפשים את הגלריה הראשית (בדרך כלל יש רק אחת)
    let gallery = await Gallery.findOne();

    // אם אין גלריה, יוצרים אחת ריקה
    if (!gallery) {
      gallery = new Gallery();
      await gallery.save();
    }

    // מחזירים רק תמונות פעילות ומסודרות לפי הסדר
    const activeImages = gallery.images
      .filter(img => img.isActive)
      .sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      data: {
        _id: gallery._id,
        name: gallery.name,
        description: gallery.description,
        images: activeImages
      }
    });
  } catch (error) {
    console.error('שגיאה בקבלת תמונות גלריה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    קבלת כל תמונות הגלריה הכללית (כולל לא פעילות) - למנהל
// @route   GET /api/gallery/admin
// @access  Private/Admin
exports.getGalleryAdmin = async (req, res) => {
  try {
    // מחפשים את הגלריה הראשית
    let gallery = await Gallery.findOne();

    // אם אין גלריה, יוצרים אחת ריקה
    if (!gallery) {
      gallery = new Gallery();
      await gallery.save();
    }

    // מחזירים את כל התמונות מסודרות לפי הסדר
    const sortedImages = [...gallery.images].sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      data: {
        _id: gallery._id,
        name: gallery.name,
        description: gallery.description,
        images: sortedImages
      }
    });
  } catch (error) {
    console.error('שגיאה בקבלת תמונות גלריה למנהל:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    עדכון פרטי הגלריה
// @route   PUT /api/gallery
// @access  Private/Admin
exports.updateGallery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    let gallery = await Gallery.findOne();

    if (!gallery) {
      gallery = new Gallery();
    }

    if (req.body.name) gallery.name = req.body.name;
    if (req.body.description) gallery.description = req.body.description;

    await gallery.save();

    res.json({
      success: true,
      data: gallery
    });
  } catch (error) {
    console.error('שגיאה בעדכון גלריה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    הוספת תמונה לגלריה
// @route   POST /api/gallery/image
// @access  Private/Admin
exports.addImage = async (req, res) => {
  try {
    let gallery = await Gallery.findOne();

    if (!gallery) {
      gallery = new Gallery();
      await gallery.save();
    }

    // מציאת הסדר הגבוה ביותר הקיים בתמונות
    const maxOrder = gallery.images.length > 0 
      ? Math.max(...gallery.images.map(img => img.order)) 
      : -1;

    // הוספת התמונה החדשה בסוף הרשימה
    gallery.images.push({
      url: req.body.url,
      publicId: req.body.publicId,
      title: req.body.title || '',
      order: maxOrder + 1,
      isActive: true
    });

    await gallery.save();

    res.status(201).json({
      success: true,
      data: gallery.images[gallery.images.length - 1]
    });
  } catch (error) {
    console.error('שגיאה בהוספת תמונה לגלריה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    עדכון תמונה בגלריה
// @route   PUT /api/gallery/image/:imageId
// @access  Private/Admin
exports.updateImage = async (req, res) => {
  try {
    const gallery = await Gallery.findOne();
    
    if (!gallery) {
      return res.status(404).json({ 
        success: false, 
        message: 'הגלריה לא נמצאה' 
      });
    }
    
    // מציאת התמונה לפי המזהה
    const imageIndex = gallery.images.findIndex(img => img._id.toString() === req.params.imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'התמונה לא נמצאה' 
      });
    }
    
    // עדכון פרטי התמונה
    if (req.body.title !== undefined) gallery.images[imageIndex].title = req.body.title;
    if (req.body.order !== undefined) gallery.images[imageIndex].order = req.body.order;
    if (req.body.isActive !== undefined) gallery.images[imageIndex].isActive = req.body.isActive;
    
    await gallery.save();
    
    res.json({
      success: true,
      data: gallery.images[imageIndex]
    });
  } catch (error) {
    console.error('שגיאה בעדכון תמונה בגלריה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    מחיקת תמונה מהגלריה
// @route   DELETE /api/gallery/image/:imageId
// @access  Private/Admin
exports.deleteImage = async (req, res) => {
  try {
    const gallery = await Gallery.findOne();
    
    if (!gallery) {
      return res.status(404).json({ 
        success: false, 
        message: 'הגלריה לא נמצאה' 
      });
    }
    
    // מציאת התמונה לפי המזהה
    const imageIndex = gallery.images.findIndex(img => img._id.toString() === req.params.imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'התמונה לא נמצאה' 
      });
    }
    
    // שמירת מזהה התמונה ב-Cloudinary למחיקה
    const publicId = gallery.images[imageIndex].publicId;
    
    // הסרת התמונה מהגלריה
    gallery.images.splice(imageIndex, 1);
    
    await gallery.save();
    
    // מחיקה מ-Cloudinary אם יש מזהה
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
    
    res.json({
      success: true,
      message: 'התמונה נמחקה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה במחיקת תמונה מהגלריה:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    שינוי סדר התמונות בגלריה
// @route   PUT /api/gallery/reorder
// @access  Private/Admin
exports.reorderImages = async (req, res) => {
  try {
    const { imageIds } = req.body;
    
    if (!Array.isArray(imageIds)) {
      return res.status(400).json({
        success: false,
        message: 'נדרש מערך של מזהי תמונות'
      });
    }
    
    const gallery = await Gallery.findOne();
    
    if (!gallery) {
      return res.status(404).json({ 
        success: false, 
        message: 'הגלריה לא נמצאה' 
      });
    }
    
    // עדכון הסדר של כל תמונה לפי הסדר במערך שהתקבל
    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      const image = gallery.images.find(img => img._id.toString() === imageId);
      
      if (image) {
        image.order = i;
      }
    }
    
    await gallery.save();
    
    res.json({
      success: true,
      message: 'סדר התמונות עודכן בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה בשינוי סדר תמונות:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
}; 