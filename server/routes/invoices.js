const express = require('express');
const router = express.Router();
const PdfPrinter = require('pdfmake');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { protect, admin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// הגדרת הגופנים עבור pdfmake
let fonts = {};
try {
  // נסה להשתמש בגופנים המותקנים
  fonts = {
    OpenSansHebrew: {
      normal: path.join(__dirname, '../fonts/OpenSansHebrew-Regular.ttf'),
      bold: path.join(__dirname, '../fonts/OpenSansHebrew-Bold.ttf'),
      italics: path.join(__dirname, '../fonts/OpenSansHebrew-Regular.ttf'),
      bolditalics: path.join(__dirname, '../fonts/OpenSansHebrew-Bold.ttf')
    }
  };
  
  // בדוק אם הקבצים קיימים
  fs.accessSync(path.join(__dirname, '../fonts/OpenSansHebrew-Regular.ttf'), fs.constants.F_OK);
  fs.accessSync(path.join(__dirname, '../fonts/OpenSansHebrew-Bold.ttf'), fs.constants.F_OK);
} catch (error) {
  console.error('שגיאה בטעינת גופנים עבריים:', error);
  
  // אם אין גישה לגופנים, השתמש בגופנים מערכתיים
  fonts = {
    Roboto: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  };
  
  console.log('משתמש בגופני מערכת במקום גופנים עבריים');
}

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
    
    // חישוב מחירים
    const basePrice = booking.room.basePrice * booking.nights;
    const vatRate = 0.17; // 17% מע"מ
    const vatAmount = booking.isTourist ? 0 : basePrice * vatRate;
    const totalPrice = booking.totalPrice;

    // יצירת מסמך PDF
    const printer = new PdfPrinter(fonts);
    
    // בדיקה איזה גופן להשתמש
    const fontName = Object.keys(fonts)[0];
    
    // הגדרת תוכן המסמך
    const docDefinition = {
      // מאפשר תמיכה בעברית מימין לשמאל
      rtl: true,
      
      // מידע על המסמך
      info: {
        title: 'חשבונית - ' + booking._id,
        author: 'מלונית רוטשילד 79',
        subject: 'חשבונית',
      },
      
      // תוכן המסמך - פורמט פשוט יותר
      content: [
        // כותרת וסמל המלון
        { text: 'מלונית רוטשילד 79', style: 'header', alignment: 'center' },
        { text: 'רוטשילד 79, פתח תקווה', alignment: 'center' },
        { text: 'טלפון: 03-1234567', alignment: 'center' },
        { text: 'diamshotels@gmail.com', alignment: 'center', margin: [0, 0, 0, 20] },
        
        // כותרת החשבונית
        { text: 'חשבונית / קבלה', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },
        
        // פרטי הזמנה - פסקאות פשוטות עם כותרת
        { text: 'פרטי הזמנה', style: 'sectionHeader', fillColor: '#f0f0f0', margin: [0, 10, 0, 10] },
        { columns: [
            { text: 'מספר הזמנה:', width: '30%', alignment: 'right', bold: true },
            { text: `${booking._id}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 0]
        },
        { columns: [
            { text: 'תאריך:', width: '30%', alignment: 'right', bold: true },
            { text: `${new Date().toLocaleDateString('he-IL')}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 15]
        },
        
        // פרטי לקוח
        { text: 'פרטי לקוח', style: 'sectionHeader', fillColor: '#f0f0f0', margin: [0, 10, 0, 10] },
        { columns: [
            { text: 'שם:', width: '30%', alignment: 'right', bold: true },
            { text: `${booking.guest.name}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 0]
        },
        { columns: [
            { text: 'טלפון:', width: '30%', alignment: 'right', bold: true },
            { text: `${booking.guest.phone}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 0]
        },
        { columns: [
            { text: 'אימייל:', width: '30%', alignment: 'right', bold: true },
            { text: `${booking.guest.email}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 15]
        },
        
        // פרטי שהייה
        { text: 'פרטי שהייה', style: 'sectionHeader', fillColor: '#f0f0f0', margin: [0, 10, 0, 10] },
        { columns: [
            { text: 'מספר חדר:', width: '30%', alignment: 'right', bold: true },
            { text: `${booking.room.roomNumber}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 0]
        },
        { columns: [
            { text: 'סוג חדר:', width: '30%', alignment: 'right', bold: true },
            { text: `${booking.room.type}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 0]
        },
        { columns: [
            { text: "תאריך צ'ק-אין:", width: '30%', alignment: 'right', bold: true },
            { text: `${new Date(booking.checkIn).toLocaleDateString('he-IL')}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 0]
        },
        { columns: [
            { text: "תאריך צ'ק-אאוט:", width: '30%', alignment: 'right', bold: true },
            { text: `${new Date(booking.checkOut).toLocaleDateString('he-IL')}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 0]
        },
        { columns: [
            { text: 'מספר לילות:', width: '30%', alignment: 'right', bold: true },
            { text: `${booking.nights}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 15]
        },
        
        // פרטי תשלום
        { text: 'פרטי תשלום', style: 'sectionHeader', fillColor: '#f0f0f0', margin: [0, 10, 0, 10] },
        { columns: [
            { text: 'מחיר בסיס:', width: '30%', alignment: 'right', bold: true },
            { text: `₪ ${basePrice.toFixed(2)}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 0]
        },
        { columns: [
            { text: 'מע"מ:', width: '30%', alignment: 'right', bold: true },
            { text: booking.isTourist ? 'פטור (תייר)' : `₪ ${vatAmount.toFixed(2)}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 0]
        },
        { canvas: [ { type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#aaaaaa' } ], margin: [0, 10, 0, 10] },
        { columns: [
            { text: 'סה"כ לתשלום:', width: '30%', alignment: 'right', bold: true, fontSize: 14 },
            { text: `₪ ${totalPrice.toFixed(2)}`, width: '70%', alignment: 'right', bold: true, fontSize: 14 }
          ],
          margin: [0, 5, 0, 10]
        },
        { columns: [
            { text: 'סטטוס תשלום:', width: '30%', alignment: 'right', bold: true },
            { text: `${booking.paymentStatus === 'paid' ? 'שולם' : 'ממתין לתשלום'}`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 0]
        },
        { columns: [
            { text: 'אמצעי תשלום:', width: '30%', alignment: 'right', bold: true },
            { text: `${
              booking.paymentMethod === 'cash' ? 'מזומן' : 
              booking.paymentMethod === 'credit' ? 'כרטיס אשראי' : 
              'העברה בנקאית'
            }`, width: '70%', alignment: 'right' }
          ],
          margin: [0, 5, 0, 20]
        },
        
        // הערת סיום
        { text: 'תודה שבחרתם במלונית רוטשילד 79!', style: 'footer', alignment: 'center', margin: [0, 30, 0, 0] }
      ],
      
      // הגדרות עיצוב
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 18,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
          alignment: 'right'
        },
        footer: {
          fontSize: 14,
          italics: true,
          alignment: 'center'
        }
      },
      
      // הגדרות דף
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      defaultStyle: {
        font: fontName
      }
    };
    
    try {
      // יצירת המסמך
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      
      // הגדרת הכותרות בתגובה
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${booking._id}.pdf`);
      
      // שליחת המסמך בתגובה
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (pdfError) {
      console.error('שגיאה ביצירת מסמך PDF:', pdfError);
      res.status(500).json({ 
        success: false, 
        message: 'שגיאה ביצירת חשבונית PDF',
        error: pdfError.message
      });
    }
    
  } catch (error) {
    console.error('שגיאה ביצירת חשבונית:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

module.exports = router; 