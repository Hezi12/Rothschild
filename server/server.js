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
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://rothschild-79.onrender.com', 
        'https://rothschild-79-client.onrender.com',
        process.env.CLIENT_URL || '*'
      ] 
    : '*', // מאפשר גישה מכל מקום בסביבת פיתוח
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// Middleware לניהול שגיאות 404 בנתיבי API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'נתיב לא נמצא',
    path: req.originalUrl
  });
});

// שירות קבצים סטטיים מתיקיית הבילד של האפליקציה במצב פרודקשן
if (process.env.NODE_ENV === 'production') {
  // שירות קבצים סטטיים
  app.use(express.static(path.join(__dirname, '../client/build')));

  // כל בקשה שאינה API תפנה לאפליקציית הריאקט
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Middleware לטיפול בשגיאות כללי
app.use((err, req, res, next) => {
  console.error('שגיאת שרת:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'שגיאת שרת פנימית' : err.message,
    details: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// הגדרת פורט
const PORT = process.env.PORT || 5000;

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`השרת פועל בפורט ${PORT}`);
}); 