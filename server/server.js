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

// נתיבי API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/invoices', require('./routes/invoices'));

// נתיב ייצוא iCal
const { generateCalendarByRoomNumber } = require('./utils/ical/icalExport');

// נתיב להורדת קבצי iCal של חדרים
app.get('/ical/room-:roomNumber.ics', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    
    // יצירת קובץ iCal
    const calendar = await generateCalendarByRoomNumber(roomNumber);
    
    // הגדרת כותרות התגובה
    res.writeHead(200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="room-${roomNumber}.ics"`,
      'Cache-Control': 'no-cache'
    });
    
    // שליחת הקובץ
    res.end(calendar.toString());
  } catch (error) {
    console.error('שגיאה בייצוא קובץ iCal:', error);
    
    // שליחת שגיאה
    res.status(404).send('קובץ לא נמצא');
  }
});

// נתיב בדיקה בסיסי
app.get('/api/test', (req, res) => {
  res.json({ message: 'שרת API של מלונית רוטשילד 79 פועל!' });
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