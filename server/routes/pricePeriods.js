const express = require('express');
const router = express.Router();
const pricePeriodController = require('../controllers/pricePeriodController');
const { protect, admin } = require('../middleware/auth');

// נתיבים לתקופות מחירים
router.route('/')
  .get(pricePeriodController.getPricePeriods)
  .post(protect, admin, pricePeriodController.createPricePeriod);

router.route('/:id')
  .get(pricePeriodController.getPricePeriodById)
  .put(protect, admin, pricePeriodController.updatePricePeriod)
  .delete(protect, admin, pricePeriodController.deletePricePeriod);

module.exports = router; 