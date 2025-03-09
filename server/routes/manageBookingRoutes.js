const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { sendCancellationConfirmation } = require('../utils/emailService');

// פונקציה לחישוב סכום ההחזר בהתאם למדיניות הביטול
const calculateRefundAmount = (booking) => {
  const today = new Date();
  const arrivalDate = new Date(booking.checkIn);
  const timeDiff = arrivalDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  // אם נשארו 3 ימים או יותר עד מועד ההגעה - החזר מלא
  if (daysDiff >= 3) {
    return booking.totalPrice;
  }
  
  // אם נשארו פחות מ-3 ימים - אין החזר
  return 0;
};

// דף ניהול הזמנה
router.get('/:id', async (req, res) => {
  try {
    // הפניה לדף הראשי (יופנה על ידי הקליינט לעמוד הנכון)
    const indexPath = path.join(__dirname, '../../client/build/index.html');
    
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    } else {
      return res.redirect('/');
    }
  } catch (error) {
    console.error('שגיאה בטעינת דף ניהול הזמנה:', error);
    return res.status(500).json({ error: 'שגיאת שרת פנימית' });
  }
});

// קבלת פרטי הזמנה לפי מזהה
router.get('/details/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'ההזמנה לא נמצאה' });
    }
    
    const room = await Room.findById(booking.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'החדר המבוקש לא נמצא' });
    }
    
    // חישוב האם ניתן לבטל ללא עלות
    const today = new Date();
    const arrivalDate = new Date(booking.checkIn);
    const timeDiff = arrivalDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const canCancelForFree = daysDiff >= 3;
    const refundAmount = calculateRefundAmount(booking);
    
    // החזרת נתוני ההזמנה עם חישובי הביטול
    return res.json({
      booking,
      room,
      cancellationDetails: {
        canCancelForFree,
        daysUntilArrival: daysDiff,
        refundAmount,
        cancellationFee: booking.totalPrice - refundAmount,
        freeCancellationDate: new Date(arrivalDate.getTime() - (3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('שגיאה בקבלת פרטי הזמנה:', error);
    return res.status(500).json({ error: 'שגיאת שרת פנימית' });
  }
});

// ביטול הזמנה
router.post('/cancel/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'ההזמנה לא נמצאה' });
    }
    
    // אם ההזמנה כבר בוטלה
    if (booking.status === 'canceled') {
      return res.status(400).json({ error: 'ההזמנה כבר בוטלה' });
    }
    
    // חישוב סכום ההחזר
    const refundAmount = calculateRefundAmount(booking);
    
    // עדכון סטטוס ההזמנה
    booking.status = 'canceled';
    booking.cancellationDetails = {
      canceledAt: new Date(),
      refundAmount,
      cancellationFee: booking.totalPrice - refundAmount
    };
    
    await booking.save();
    
    // שליחת אימייל אישור ביטול
    const room = await Room.findById(booking.roomId);
    await sendCancellationConfirmation(booking, room, refundAmount);
    
    return res.json({
      success: true,
      message: 'ההזמנה בוטלה בהצלחה',
      booking,
      cancellationDetails: {
        refundAmount,
        cancellationFee: booking.totalPrice - refundAmount
      }
    });
  } catch (error) {
    console.error('שגיאה בביטול הזמנה:', error);
    return res.status(500).json({ error: 'שגיאת שרת פנימית' });
  }
});

module.exports = router;
