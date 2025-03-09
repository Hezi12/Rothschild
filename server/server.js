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

// דף נחיתה לביטול הזמנות
app.get('/cancel', (req, res) => {
  const bookingId = req.query.id || '';
  
  res.send(`
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ביטול או שינוי הזמנה - מלונית רוטשילד 79</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          padding: 30px;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        .header {
          margin-bottom: 25px;
          border-bottom: 2px solid #1976d2;
          padding-bottom: 15px;
        }
        h1 {
          color: #1976d2;
          font-size: 26px;
          margin-bottom: 10px;
        }
        h2 {
          font-size: 20px;
          color: #555;
          font-weight: normal;
          margin-bottom: 30px;
        }
        .info-box {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: right;
          border-right: 4px solid #1976d2;
        }
        .step {
          margin: 25px 0;
          text-align: right;
        }
        .step-number {
          display: inline-block;
          width: 30px;
          height: 30px;
          background-color: #1976d2;
          color: white;
          border-radius: 50%;
          text-align: center;
          line-height: 30px;
          margin-left: 10px;
          font-weight: bold;
        }
        .whatsapp-btn {
          display: inline-block;
          background-color: #25d366;
          color: white;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 50px;
          font-weight: bold;
          margin: 20px 0;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        .whatsapp-btn:hover {
          background-color: #128c7e;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .policy {
          background-color: #fff9c4;
          border-radius: 8px;
          padding: 15px;
          margin-top: 30px;
          border-right: 4px solid #ffc107;
          text-align: right;
        }
        .policy h3 {
          color: #f57c00;
          margin-bottom: 10px;
        }
        .footer {
          margin-top: 40px;
          color: #777;
          font-size: 14px;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        @media (max-width: 600px) {
          .container {
            margin: 20px;
            padding: 20px;
          }
          h1 {
            font-size: 22px;
          }
          h2 {
            font-size: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ביטול או שינוי הזמנה</h1>
          <h2>מלונית רוטשילד 79</h2>
        </div>
        
        <div class="info-box">
          <p>לביטול או שינוי ההזמנה שלך, אנא שלח/י הודעת וואטסאפ למספר <strong>050-607-0260</strong> עם פרטי ההזמנה.</p>
        </div>
        
        <div class="step">
          <span class="step-number">1</span>
          <span>מצא/י את מספר ההזמנה שלך במייל האישור שקיבלת</span>
        </div>
        
        <div class="step">
          <span class="step-number">2</span>
          <span>לחץ/י על הכפתור למטה לפתיחת צ'אט וואטסאפ</span>
        </div>
        
        <div class="step">
          <span class="step-number">3</span>
          <span>ציין/י את מספר ההזמנה ואת הבקשה שלך (ביטול או שינוי פרטים)</span>
        </div>
        
        <a href="https://wa.me/972506070260?text=שלום,%20ברצוני%20לבטל/לשנות%20את%20הזמנה%20מספר:%20${bookingId}" class="whatsapp-btn">
          פתיחת צ'אט וואטסאפ
        </a>
        
        <div class="policy">
          <h3>מדיניות ביטול הזמנות:</h3>
          <p>• ביטול עד 3 ימים לפני ההגעה - ללא עלות</p>
          <p>• ביטול פחות מ-3 ימים לפני ההגעה - חיוב במחיר מלא</p>
          <p>• שינויים בהזמנה כפופים לזמינות ולמדיניות הביטול</p>
        </div>
        
        <div class="footer">
          <p>צוות מלונית רוטשילד 79</p>
          <p>טלפון: 050-607-0260 | אימייל: diamshotels@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `);
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