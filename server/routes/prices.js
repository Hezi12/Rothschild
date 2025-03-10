const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const priceController = require('../controllers/priceController');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/prices
// @desc    קבלת מחירים דינמיים
// @access  Private/Admin
router.get('/', [protect, admin], priceController.getDynamicPrices);

// @route   POST /api/prices
// @desc    הגדרת מחיר דינמי לחדר
// @access  Private/Admin
router.post(
  '/',
  [
    protect,
    admin,
    [
      check('roomId', 'נדרש מזהה חדר').not().isEmpty(),
      check('date', 'נדרש תאריך תקין').isISO8601(),
      check('price', 'המחיר חייב להיות מספר חיובי').isFloat({ min: 0 })
    ]
  ],
  priceController.setDynamicPrice
);

// @route   PUT /api/prices/bulk
// @desc    עדכון מחירים בצורה גורפת
// @access  Private/Admin
router.put(
  '/bulk',
  [
    protect,
    admin,
    [
      check('roomIds', 'נדרש מערך של מזהי חדרים').isArray(),
      check('startDate', 'נדרש תאריך התחלה תקין').isISO8601(),
      check('endDate', 'נדרש תאריך סיום תקין').isISO8601(),
      check('price', 'המחיר חייב להיות מספר חיובי').isFloat({ min: 0 })
    ]
  ],
  priceController.bulkUpdatePrices
);

// @route   DELETE /api/prices/:id
// @desc    מחיקת מחיר דינמי
// @access  Private/Admin
router.delete('/:id', [protect, admin], priceController.deleteDynamicPrice);

// @route   DELETE /api/prices/reset
// @desc    איפוס מחירים דינמיים
// @access  Private/Admin
router.post(
  '/reset',
  [
    protect,
    admin,
    [
      check('startDate', 'נדרש תאריך התחלה תקין').optional().isISO8601(),
      check('endDate', 'נדרש תאריך סיום תקין').optional().isISO8601()
    ]
  ],
  priceController.resetDynamicPrices
);

module.exports = router; 