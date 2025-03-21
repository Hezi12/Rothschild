const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/auth');

// טעינת המודל
const SimpleBooking = mongoose.model('SimpleBooking');

/**
 * נתיב: GET /api/simple-bookings
 * תיאור: קבלת הזמנות פשוטות
 * גישה: לאחר התחברות
 */
router.get('/', protect, async (req, res) => {
  try {
    // קבלת פרמטרים מה-query string
    const { location, date } = req.query;
    let query = {};
    
    if (location) {
      query.location = location;
    }
    
    if (date) {
      // אם נשלח תאריך ספציפי, חפש הזמנות לאותו יום
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    // קבלת ההזמנות מהמסד נתונים
    const simpleBookings = await SimpleBooking.find(query).sort({ date: 1 });
    
    res.json({
      success: true,
      count: simpleBookings.length,
      simpleBookings
    });
  } catch (err) {
    console.error('שגיאה בקבלת הזמנות פשוטות:', err);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת בקבלת הזמנות',
      error: err.message
    });
  }
});

/**
 * נתיב: POST /api/simple-bookings
 * תיאור: יצירת הזמנה פשוטה חדשה
 * גישה: לאחר התחברות
 */
router.post('/', protect, async (req, res) => {
  try {
    const { 
      date, 
      location, 
      roomId, 
      guestName, 
      phone, 
      notes, 
      nights, 
      isPaid 
    } = req.body;
    
    // וידוא שיש תאריך, מיקום ומספר חדר
    if (!date || !location || !roomId) {
      return res.status(400).json({
        success: false,
        message: 'חסרים פרטים: תאריך, מיקום או מספר חדר'
      });
    }
    
    // בדיקה אם כבר קיימת הזמנה לאותו חדר באותו תאריך
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    
    const existingBooking = await SimpleBooking.findOne({
      date: bookingDate,
      location,
      roomId
    });
    
    if (existingBooking) {
      // עדכון ההזמנה הקיימת
      existingBooking.guestName = guestName || '';
      existingBooking.phone = phone || '';
      existingBooking.notes = notes || '';
      existingBooking.nights = nights || 1;
      existingBooking.isPaid = isPaid || false;
      existingBooking.updatedAt = new Date();
      
      await existingBooking.save();
      
      return res.json({
        success: true,
        message: 'ההזמנה עודכנה בהצלחה',
        booking: existingBooking
      });
    }
    
    // יצירת הזמנה חדשה
    const newBooking = new SimpleBooking({
      date: bookingDate,
      location,
      roomId,
      guestName: guestName || '',
      phone: phone || '',
      notes: notes || '',
      nights: nights || 1,
      isPaid: isPaid || false
    });
    
    // שמירה במסד הנתונים
    await newBooking.save();
    
    res.status(201).json({
      success: true,
      message: 'ההזמנה נוצרה בהצלחה',
      booking: newBooking
    });
  } catch (err) {
    console.error('שגיאה ביצירת הזמנה פשוטה:', err);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת ביצירת הזמנה',
      error: err.message
    });
  }
});

/**
 * נתיב: PUT /api/simple-bookings/:id
 * תיאור: עדכון הזמנה פשוטה
 * גישה: לאחר התחברות
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      guestName, 
      phone, 
      notes, 
      nights, 
      isPaid 
    } = req.body;
    
    // חיפוש ההזמנה במסד הנתונים
    const booking = await SimpleBooking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }
    
    // עדכון פרטי ההזמנה
    if (guestName !== undefined) booking.guestName = guestName;
    if (phone !== undefined) booking.phone = phone;
    if (notes !== undefined) booking.notes = notes;
    if (nights !== undefined) booking.nights = nights;
    if (isPaid !== undefined) booking.isPaid = isPaid;
    
    booking.updatedAt = new Date();
    
    // שמירת השינויים
    await booking.save();
    
    res.json({
      success: true,
      message: 'ההזמנה עודכנה בהצלחה',
      booking
    });
  } catch (err) {
    console.error('שגיאה בעדכון הזמנה פשוטה:', err);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת בעדכון הזמנה',
      error: err.message
    });
  }
});

/**
 * נתיב: DELETE /api/simple-bookings/:id
 * תיאור: מחיקת הזמנה פשוטה
 * גישה: לאחר התחברות
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // מחיקת ההזמנה
    const result = await SimpleBooking.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'ההזמנה לא נמצאה'
      });
    }
    
    res.json({
      success: true,
      message: 'ההזמנה נמחקה בהצלחה'
    });
  } catch (err) {
    console.error('שגיאה במחיקת הזמנה פשוטה:', err);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת במחיקת הזמנה',
      error: err.message
    });
  }
});

module.exports = router; 