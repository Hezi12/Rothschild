const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { isTokenValid } = require('../utils/tokenUtils');
const { sendCancellationConfirmation } = require('../utils/emailService');

/**
 * @route   GET /api/cancel
 * @desc    עמוד אישור לפני ביטול הזמנה
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'לא נמצא טוקן ביטול' 
      });
    }

    // חיפוש ההזמנה לפי הטוקן
    const booking = await Booking.findOne({ cancellationToken: token });

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'לא נמצאה הזמנה מתאימה או שהטוקן אינו תקין' 
      });
    }

    // בדיקה אם ההזמנה כבר בוטלה
    if (booking.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'ההזמנה כבר בוטלה' 
      });
    }

    // בדיקה אם הטוקן עדיין בתוקף
    if (!isTokenValid(booking.createdAt, booking.checkIn)) {
      return res.status(400).json({ 
        success: false, 
        message: 'לא ניתן לבטל את ההזמנה. עברו יותר מ-3 ימים לפני צ\'ק-אין או שתאריך הצ\'ק-אין כבר עבר.' 
      });
    }

    // מחשב אם ניתן החזר מלא (יותר מ-3 ימים לפני צ'ק-אין)
    const now = new Date();
    const threeBeforeCheckIn = new Date(booking.checkIn);
    threeBeforeCheckIn.setDate(threeBeforeCheckIn.getDate() - 3);
    const isFullRefund = now <= threeBeforeCheckIn;

    // מחשב את סכום ההחזר
    const refundAmount = isFullRefund ? booking.amountPaid : 0;

    // החזרת פרטי ההזמנה לאישור ביטול
    return res.json({
      success: true,
      booking: {
        id: booking._id,
        guest: booking.guest,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        totalPrice: booking.totalPrice,
        amountPaid: booking.amountPaid,
        refundAmount: refundAmount,
        isFullRefund: isFullRefund
      }
    });
  } catch (err) {
    console.error('שגיאה בבדיקת טוקן ביטול:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

/**
 * @route   POST /api/cancel
 * @desc    ביטול הזמנה באמצעות טוקן
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { token, reason } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'לא נמצא טוקן ביטול' 
      });
    }

    // חיפוש ההזמנה לפי הטוקן
    const booking = await Booking.findOne({ cancellationToken: token });

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'לא נמצאה הזמנה מתאימה או שהטוקן אינו תקין' 
      });
    }

    // בדיקה אם ההזמנה כבר בוטלה
    if (booking.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'ההזמנה כבר בוטלה' 
      });
    }

    // בדיקה אם הטוקן עדיין בתוקף
    if (!isTokenValid(booking.createdAt, booking.checkIn)) {
      return res.status(400).json({ 
        success: false, 
        message: 'לא ניתן לבטל את ההזמנה. עברו יותר מ-3 ימים לפני צ\'ק-אין או שתאריך הצ\'ק-אין כבר עבר.' 
      });
    }

    // מחשב אם ניתן החזר מלא (יותר מ-3 ימים לפני צ'ק-אין)
    const now = new Date();
    const threeBeforeCheckIn = new Date(booking.checkIn);
    threeBeforeCheckIn.setDate(threeBeforeCheckIn.getDate() - 3);
    const isFullRefund = now <= threeBeforeCheckIn;

    // מחשב את סכום ההחזר
    const refundAmount = isFullRefund ? booking.amountPaid : 0;

    // עדכון ההזמנה במסד הנתונים
    booking.status = 'cancelled';
    booking.cancellationDate = new Date();
    booking.cancellationReason = reason || 'ביטול ביוזמת הלקוח';
    await booking.save();

    // קבלת פרטי החדר לצורך שליחת אימייל
    const room = await Room.findById(booking.roomId);

    // שליחת אימייל אישור ביטול
    try {
      const cancellationDetails = {
        refundAmount: refundAmount,
        reason: reason || 'ביטול ביוזמת הלקוח'
      };
      
      await sendCancellationConfirmation(booking, room, cancellationDetails);
      console.log('אימייל אישור ביטול נשלח ללקוח');
    } catch (emailError) {
      console.error('שגיאה בשליחת אימייל אישור ביטול:', emailError);
      // ממשיכים למרות שגיאה בשליחת האימייל
    }

    // החזרת תשובה חיובית
    return res.json({
      success: true,
      message: 'ההזמנה בוטלה בהצלחה',
      cancellation: {
        date: booking.cancellationDate,
        refundAmount: refundAmount,
        isFullRefund: isFullRefund
      }
    });
  } catch (err) {
    console.error('שגיאה בביטול הזמנה:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

module.exports = router; 