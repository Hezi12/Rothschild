const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const roomController = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');

// יצירת הזמנה רגילה
router.post('/', bookingController.createBooking);

// יצירת הזמנה מרובת חדרים
router.post('/multi-room', roomController.createMultiRoomBooking);

module.exports = router; 