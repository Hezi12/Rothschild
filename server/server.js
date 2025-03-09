const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// טעינת משתני סביבה מקובץ .env
dotenv.config();

// טעינת מודלים
require('./models/Room');
require('./models/Booking');
require('./models/User');
require('./models/BlockedDate');

// יצירת אפליקציית Express
const app = express();

// Middleware
// הגדרות CORS דינמיות לפי סביבה
const corsOptions = {
  origin: '*', // מאפשר גישה מכל מקום בסביבת פיתוח
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'Cache-Control', 'Pragma', 'Expires'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// חיבור למסד נתונים MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('חיבור למסד הנתונים הצליח'))
.catch(err => console.error('שגיאה בחיבור למסד הנתונים:', err));

// Import Routes
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chatRoutes');

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// נתיבי API
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/invoices', require('./routes/invoices'));

// נתיב בדיקה בסיסי
app.get('/api/test', (req, res) => {
  res.json({ message: 'שרת API של מלונית רוטשילד 79 פועל!' });
});

// נתיב ביטול ישיר - נגיש מחוץ ל-API הרגיל
app.get('/cancel/:id', async (req, res) => {
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
    
    const Booking = require('./models/Booking');
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'roomNumber type basePrice');
    
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
      const { sendCancellationAlert } = require('./utils/emailService');
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

// שירות קבצים סטטיים מתיקיית הבילד של האפליקציה במצב פרודקשן
if (process.env.NODE_ENV === 'production') {
  // שירות קבצים סטטיים
  app.use(express.static(path.join(__dirname, '../client/build')));

  // כל בקשה שאינה API תפנה לאפליקציית הריאקט
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
    }
  });
}

// הגדרת פורט
const PORT = process.env.PORT || 5000;

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`השרת פועל בפורט ${PORT}`);
}); 