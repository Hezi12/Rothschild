const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const galleryController = require('../controllers/galleryController');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/gallery
// @desc    קבלת פרטי הגלריה הראשית
// @access  Public
router.get('/', galleryController.getGallery);

// @route   GET /api/gallery/admin
// @desc    קבלת פרטי הגלריה כולל תמונות לא פעילות (למנהל)
// @access  Private/Admin
router.get('/admin', [protect, admin], galleryController.getGalleryAdmin);

// @route   POST /api/gallery
// @desc    יצירת גלריה חדשה (אם לא קיימת)
// @access  Private/Admin
router.post(
  '/',
  [
    protect,
    admin,
    [
      check('name', 'נא להזין שם').optional(),
      check('description', 'נא להזין תיאור').optional()
    ]
  ],
  galleryController.createGallery
);

// @route   PUT /api/gallery
// @desc    עדכון פרטי הגלריה
// @access  Private/Admin
router.put(
  '/',
  [
    protect,
    admin,
    [
      check('name', 'נא להזין שם').optional(),
      check('description', 'נא להזין תיאור').optional()
    ]
  ],
  galleryController.updateGallery
);

// @route   POST /api/gallery/image
// @desc    הוספת תמונה לגלריה
// @access  Private/Admin
router.post(
  '/image',
  [
    protect,
    admin,
    [
      check('url', 'נדרשת כתובת URL לתמונה').notEmpty(),
      check('publicId', 'נדרש מזהה ציבורי').optional(),
      check('title', 'נדרשת כותרת').optional()
    ]
  ],
  galleryController.addImage
);

// @route   PUT /api/gallery/image/:imageId
// @desc    עדכון תמונה בגלריה
// @access  Private/Admin
router.put(
  '/image/:imageId',
  [
    protect,
    admin
  ],
  galleryController.updateImage
);

// @route   DELETE /api/gallery/image/:imageId
// @desc    מחיקת תמונה מהגלריה
// @access  Private/Admin
router.delete(
  '/image/:imageId',
  [protect, admin],
  galleryController.deleteImage
);

// @route   PUT /api/gallery/reorder
// @desc    שינוי סדר התמונות בגלריה
// @access  Private/Admin
router.put(
  '/reorder',
  [
    protect,
    admin,
    [
      check('imageIds', 'נדרש מערך של מזהי תמונות').isArray()
    ]
  ],
  galleryController.reorderImages
);

module.exports = router; 