const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/invoices/:bookingId
// @desc    יצירת חשבונית PDF להזמנה
// @access  Private/Admin
router.get('/:bookingId', [protect, admin], async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('room', 'roomNumber type basePrice');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'ההזמנה לא נמצאה' 
      });
    }
    
    // יצירת מסמך PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // הגדרת כותרת למסמך
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${booking.bookingNumber}.pdf`);
    
    // הזרמת ה-PDF לתגובה
    doc.pipe(res);
    
    // הוספת לוגו וכותרת
    doc.fontSize(20).text('מלונית רוטשילד 79', { align: 'right' });
    doc.fontSize(12).text('רח\' רוטשילד 79, פתח תקווה', { align: 'right' });
    doc.text('טלפון: 03-1234567', { align: 'right' });
    doc.text('diamshotels@gmail.com', { align: 'right' });
    
    doc.moveDown();
    doc.fontSize(16).text('חשבונית / קבלה', { align: 'center' });
    doc.moveDown();
    
    // פרטי הזמנה
    doc.fontSize(14).text('פרטי הזמנה:', { align: 'right' });
    doc.fontSize(12).text(`מספר הזמנה: ${booking.bookingNumber}`, { align: 'right' });
    doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, { align: 'right' });
    doc.moveDown();
    
    // פרטי לקוח
    doc.fontSize(14).text('פרטי לקוח:', { align: 'right' });
    doc.fontSize(12).text(`שם: ${booking.guest.name}`, { align: 'right' });
    doc.text(`טלפון: ${booking.guest.phone}`, { align: 'right' });
    doc.text(`אימייל: ${booking.guest.email}`, { align: 'right' });
    doc.moveDown();
    
    // פרטי שהייה
    doc.fontSize(14).text('פרטי שהייה:', { align: 'right' });
    doc.fontSize(12).text(`חדר מספר: ${booking.room.roomNumber}`, { align: 'right' });
    doc.text(`סוג חדר: ${booking.room.type}`, { align: 'right' });
    doc.text(`תאריך צ'ק-אין: ${booking.checkIn.toLocaleDateString('he-IL')}`, { align: 'right' });
    doc.text(`תאריך צ'ק-אאוט: ${booking.checkOut.toLocaleDateString('he-IL')}`, { align: 'right' });
    doc.text(`מספר לילות: ${booking.nights}`, { align: 'right' });
    doc.moveDown();
    
    // פרטי תשלום
    doc.fontSize(14).text('פרטי תשלום:', { align: 'right' });
    
    // חישוב מחירים
    const basePrice = booking.room.basePrice * booking.nights;
    const vatRate = 0.17; // 17% מע"מ
    const vatAmount = booking.isTourist ? 0 : basePrice * vatRate;
    const totalPrice = booking.totalPrice;
    
    doc.fontSize(12).text(`מחיר בסיס: ${basePrice.toFixed(2)} ₪`, { align: 'right' });
    
    if (!booking.isTourist) {
      doc.text(`מע"מ (17%): ${vatAmount.toFixed(2)} ₪`, { align: 'right' });
    } else {
      doc.text('מע"מ: פטור (תייר)', { align: 'right' });
    }
    
    doc.fontSize(14).text(`סה"כ לתשלום: ${totalPrice.toFixed(2)} ₪`, { align: 'right' });
    doc.text(`סטטוס תשלום: ${booking.paymentStatus === 'paid' ? 'שולם' : 'ממתין לתשלום'}`, { align: 'right' });
    doc.text(`אמצעי תשלום: ${
      booking.paymentMethod === 'cash' ? 'מזומן' : 
      booking.paymentMethod === 'credit' ? 'כרטיס אשראי' : 
      'העברה בנקאית'
    }`, { align: 'right' });
    
    doc.moveDown(2);
    
    // חתימה
    doc.fontSize(12).text('תודה שבחרתם במלונית רוטשילד 79!', { align: 'center' });
    
    // סיום המסמך
    doc.end();
  } catch (error) {
    console.error('שגיאה ביצירת חשבונית:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

module.exports = router; 