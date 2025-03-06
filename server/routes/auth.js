const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    רישום משתמש חדש
// @access  Public
router.post(
  '/register',
  [
    check('name', 'נא להזין שם').not().isEmpty(),
    check('email', 'נא להזין כתובת אימייל תקינה').isEmail(),
    check('password', 'נא להזין סיסמה באורך 6 תווים לפחות').isLength({ min: 6 })
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    התחברות משתמש
// @access  Public
router.post(
  '/login',
  [
    check('email', 'נא להזין כתובת אימייל תקינה').isEmail(),
    check('password', 'נא להזין סיסמה').exists()
  ],
  authController.login
);

// @route   GET /api/auth/me
// @desc    קבלת פרטי המשתמש הנוכחי
// @access  Private
router.get('/me', protect, authController.getMe);

module.exports = router; 