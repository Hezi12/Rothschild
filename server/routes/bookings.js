const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');
const Booking = require('../models/Booking');
const { sendCancellationAlert } = require('../utils/emailService');

/**
 * ניתובי API חדשים ומשופרים למערכת ההזמנות
 */

// ניתובים רגילים - דורשים הרשאת משתמש רגיל
router
  .route('/')
  .get(protect, bookingController.getBookings)
  .post(protect, bookingController.createBooking);

// ניתובים ספציפיים להזמנה - מזהה מסוים
router
  .route('/:id')
  .get(protect, bookingController.getBookingById)
  .put(protect, bookingController.updateBooking)
  .delete(protect, bookingController.deleteBooking);

// עדכון סטטוס תשלום
router
  .route('/:id/payment-status')
  .put(protect, bookingController.updatePaymentStatus);

// נקודת קצה ייעודית לביטול הזמנה
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const bookingId = req.params.id;
    console.log(`טיפול בבקשת ביטול הזמנה: ${bookingId}`);
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'הזמנה לא נמצאה'
      });
    }
    
    // עדכון סטטוס ההזמנה לבוטל
    booking.paymentStatus = 'canceled';
    booking.status = 'canceled';
    
    await booking.save();
    
    // שליחת התראה על ביטול למנהל (אם קיים)
    try {
      await sendCancellationAlert(booking);
    } catch (emailError) {
      console.error('שגיאה בשליחת התראת ביטול:', emailError);
    }
    
    return res.status(200).json({
      success: true,
      message: 'ההזמנה בוטלה בהצלחה',
      data: booking
    });
  } catch (error) {
    console.error('שגיאה בביטול הזמנה:', error);
    return res.status(500).json({
      success: false,
      message: 'שגיאת שרת בעת ביטול ההזמנה',
      error: error.message
    });
  }
});

// מחיקה מוחלטת של הזמנה
router
  .route('/:id/hard-delete')
  .delete(protect, admin, bookingController.hardDeleteBooking);

// מחיקה מוחלטת של מספר הזמנות
router
  .route('/hard-delete-many')
  .post(protect, admin, bookingController.hardDeleteManyBookings);

// יצירת חשבונית PDF
router
  .route('/:id/invoice')
  .get(async (req, res, next) => {
    // בדיקה אם התקבל טוקן בפרמטרי השאילתה
    if (req.query.token) {
      try {
        // הגדרת הטוקן בכותרות הבקשה
        req.headers.authorization = `Bearer ${req.query.token}`;
      } catch (error) {
        console.error('שגיאה בעיבוד טוקן:', error);
      }
    }
    // המשך לפונקציית האימות
    protect(req, res, next);
  }, bookingController.generateInvoicePdf);

// סטטיסטיקות
router
  .route('/stats')
  .get(protect, admin, bookingController.getBookingsStats);

// מחיקת נקודת קצה למחיקת כל ההזמנות
// router
//   .route('/all')
//   .delete(protect, admin, bookingController.deleteAllBookings);

// מחיקת נקודת קצה ללא אימות למצבי חירום
// router
//   .route('/emergency-cleanup')
//   .delete(async (req, res) => {
//     try {
//       const Booking = require('../models/Booking');
//       
//       // מחיקת כל ההזמנות
//       const result = await Booking.deleteMany({});
//       
//       console.log(`מחיקת חירום: נמחקו ${result.deletedCount} הזמנות`);
//       
//       return res.json({
//         success: true,
//         message: `מחיקת חירום בוצעה בהצלחה: נמחקו ${result.deletedCount} הזמנות`,
//         count: result.deletedCount
//       });
//     } catch (error) {
//       console.error('שגיאה במחיקת חירום של הזמנות:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'שגיאה במחיקת הנתונים',
//         error: error.message
//       });
//     }
//   });

// @route   GET /api/bookings/cancel-request/:id
// @desc    עמוד בקשת ביטול הזמנה
// @access  Public
router.get('/cancel-request/:id', async (req, res) => {
  try {
    console.log('קיבלנו בקשת ביטול עם מזהה:', req.params.id);
    
    // וידוא שהמזהה תקין
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'מזהה הזמנה לא תקין' 
      });
    }
    
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'roomNumber type basePrice')
      .select('+creditCard');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'ההזמנה לא נמצאה' 
      });
    }
    
    // חישוב הפרש הימים בין היום לתאריך הצ'ק-אין
    const today = new Date();
    today.setHours(0, 0, 0, 0); // איפוס שעות
    
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(0, 0, 0, 0); // איפוס שעות
    
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // קביעת סטטוס הביטול לפי מדיניות החברה
    const cancellationStatus = {
      isFree: diffDays >= 3,
      daysUntilCheckIn: diffDays,
      fee: diffDays >= 3 ? 0 : booking.totalPrice
    };
    
    res.json({
      success: true,
      data: {
        booking,
        cancellationStatus
      }
    });
  } catch (error) {
    console.error('שגיאה בבקשת ביטול:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

// @route   GET /api/bookings/room/:roomId
// @desc    קבלת כל ההזמנות לחדר מסוים
// @access  Private/Admin
router.get('/room/:roomId', [protect, admin], bookingController.getRoomBookings);

// @route   POST /api/bookings/cancel-request/:id
// @desc    שליחת בקשת ביטול הזמנה
// @access  Public
router.post('/cancel-request/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'roomNumber type')
      .select('+creditCard');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'ההזמנה לא נמצאה' 
      });
    }
    
    // חישוב הפרש הימים בין היום לתאריך הצ'ק-אין
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // האם חינם או בתשלום
    const isFree = diffDays >= 3;
    const cancellationFee = isFree ? 0 : booking.totalPrice;
    
    // פרטי הביטול
    const cancellationDetails = {
      isFree,
      fee: cancellationFee,
      daysUntilCheckIn: diffDays
    };
    
    // שליחת מייל למנהל על בקשת הביטול
    try {
      await sendCancellationAlert(booking, cancellationDetails);
      console.log('נשלחה התראת ביטול למנהל');
    } catch (error) {
      console.error('שגיאה בשליחת התראת ביטול למנהל:', error);
      // ממשיכים למרות שגיאה בשליחת האימייל
    }
    
    res.json({
      success: true,
      message: 'בקשת הביטול התקבלה בהצלחה',
      data: {
        isFree,
        cancellationFee,
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber
      }
    });
  } catch (error) {
    console.error('שגיאה בשליחת בקשת ביטול:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

// @route   GET /api/bookings/direct-cancel-request/:id
// @desc    נקודת קצה ישירה לבקשת ביטול שמפנה לדף באתר
// @access  Public
router.get('/direct-cancel-request/:id', async (req, res) => {
  try {
    console.log('קיבלנו בקשת ביטול ישירה עם מזהה:', req.params.id);
    
    // וידוא שהמזהה תקין
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send(`
        <html dir="rtl">
          <head>
            <meta charset="utf-8">
            <title>שגיאה - מזהה הזמנה לא תקין</title>
            <meta http-equiv="refresh" content="5;url=${process.env.WEBSITE_URL || 'http://localhost:3000'}">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #e53935; }
              p { margin: 20px 0; }
              .redirect { color: #666; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <h1>שגיאה - מזהה הזמנה לא תקין</h1>
            <p>לא ניתן למצוא את ההזמנה המבוקשת.</p>
            <p class="redirect">מועבר לדף הבית בעוד 5 שניות...</p>
          </body>
        </html>
      `);
    }
    
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'roomNumber type basePrice')
      .select('+creditCard');
    
    if (!booking) {
      return res.status(404).send(`
        <html dir="rtl">
          <head>
            <meta charset="utf-8">
            <title>שגיאה - ההזמנה לא נמצאה</title>
            <meta http-equiv="refresh" content="5;url=${process.env.WEBSITE_URL || 'http://localhost:3000'}">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #e53935; }
              p { margin: 20px 0; }
              .redirect { color: #666; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <h1>שגיאה - ההזמנה לא נמצאה</h1>
            <p>לא ניתן למצוא את ההזמנה המבוקשת.</p>
            <p class="redirect">מועבר לדף הבית בעוד 5 שניות...</p>
          </body>
        </html>
      `);
    }
    
    // חישוב הפרש הימים בין היום לתאריך הצ'ק-אין
    const today = new Date();
    today.setHours(0, 0, 0, 0); // איפוס שעות
    
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(0, 0, 0, 0); // איפוס שעות
    
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // קביעת סטטוס הביטול לפי מדיניות החברה
    const isFree = diffDays >= 3;
    const cancellationFee = isFree ? 0 : booking.totalPrice;
    const feeFormatted = cancellationFee.toFixed(2);
    
    // שליחת מייל התראה למנהל
    const cancellationDetails = {
      isFree,
      fee: cancellationFee,
      daysUntilCheckIn: diffDays
    };
    
    try {
      await sendCancellationAlert(booking, cancellationDetails);
      console.log('נשלחה התראת ביטול למנהל');
    } catch (emailError) {
      console.error('שגיאה בשליחת התראת ביטול למנהל:', emailError);
    }
    
    // שלב זה נשלח HTML עם מידע על הביטול ישירות מהשרת
    res.status(200).send(`
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>בקשת הביטול התקבלה</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 30px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.6;
            }
            .container {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 30px;
              margin: 30px 0;
              box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            }
            h1 { 
              color: #4caf50;
              margin-bottom: 30px;
            }
            .details {
              background-color: ${isFree ? '#e8f5e9' : '#ffebee'};
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: right;
              border-right: 4px solid ${isFree ? '#4caf50' : '#f44336'};
            }
            .status {
              font-size: 20px;
              font-weight: bold;
              color: ${isFree ? '#2e7d32' : '#c62828'};
              margin: 15px 0;
            }
            .back-link {
              display: inline-block;
              margin-top: 30px;
              background-color: #1976d2;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 4px;
            }
            p { margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>בקשת הביטול התקבלה בהצלחה</h1>
            
            <p class="status">
              ${isFree 
                ? 'ההזמנה בוטלה ללא עלות' 
                : `ההזמנה בוטלה בעלות של ₪${feeFormatted}`}
            </p>
            
            <div class="details">
              <p><strong>מספר הזמנה:</strong> ${booking.bookingNumber}</p>
              <p><strong>פרטי חדר:</strong> ${booking.room.roomNumber} - ${booking.room.type}</p>
              <p><strong>שם אורח:</strong> ${booking.guest.name}</p>
              <p><strong>תאריך הגעה:</strong> ${new Date(booking.checkIn).toLocaleDateString('he-IL')}</p>
              <p><strong>תאריך יציאה:</strong> ${new Date(booking.checkOut).toLocaleDateString('he-IL')}</p>
              <p><strong>מספר לילות:</strong> ${booking.nights}</p>
              <p><strong>תאריך ביטול:</strong> ${new Date().toLocaleDateString('he-IL')}</p>
              ${!isFree ? `<p><strong>עלות ביטול:</strong> ₪${feeFormatted}</p>` : ''}
            </div>
            
            <p>
              בקשת הביטול שלך התקבלה והועברה לטיפול.
              ${isFree 
                ? 'הביטול אושר ללא עלות כיוון שבוצע 3 ימים או יותר לפני מועד ההגעה.' 
                : 'הביטול אושר בחיוב מלא כיוון שבוצע פחות מ-3 ימים לפני מועד ההגעה.'}
            </p>
            
            <p>התראה על הביטול נשלחה למנהל המערכת וההזמנה תבוטל באופן ידני.</p>
            
            <a href="${process.env.WEBSITE_URL || 'http://localhost:3000'}" class="back-link">חזרה לאתר המלונית</a>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('שגיאה בבקשת ביטול ישירה:', error);
    res.status(500).send(`
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>שגיאה - לא ניתן לבטל את ההזמנה</title>
          <meta http-equiv="refresh" content="5;url=${process.env.WEBSITE_URL || 'http://localhost:3000'}">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e53935; }
            p { margin: 20px 0; }
            .redirect { color: #666; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <h1>שגיאה - לא ניתן לבטל את ההזמנה</h1>
          <p>אירעה שגיאה במהלך ביטול ההזמנה. אנא נסה שוב מאוחר יותר או צור קשר עם המלונית.</p>
          <p class="redirect">מועבר לדף הבית בעוד 5 שניות...</p>
        </body>
      </html>
    `);
  }
});

// @route   DELETE /api/bookings/room/:roomId
// @desc    מחיקת כל ההזמנות של חדר ספציפי
// @access  Private/Admin
router.delete('/room/:roomId', [protect, admin], async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // מחיקת כל ההזמנות לחדר
    const bookingsDeleteResult = await Booking.deleteMany({ room: roomId });
    
    // מחיקת כל החסימות לחדר
    // const BlockedDate = require('../models/BlockedDate');
    // const blocksDeleteResult = await BlockedDate.deleteMany({ room: roomId });
    
    res.json({
      success: true,
      message: `נמחקו ${bookingsDeleteResult.deletedCount} הזמנות לחדר`,
      // blocksDeleted: blocksDeleteResult.deletedCount
    });
  } catch (error) {
    console.error('שגיאה במחיקת הזמנות לחדר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
});

module.exports = router; 