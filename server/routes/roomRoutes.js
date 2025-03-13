const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');

// בדיקת זמינות חדר
router.post('/check-availability', roomController.checkAvailability);

// בדיקת זמינות למספר חדרים
router.post('/check-multiple-availability', roomController.checkMultipleAvailability);

module.exports = router; 