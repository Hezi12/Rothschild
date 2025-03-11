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
require('./models/Gallery');
require('./models/DynamicPrice');

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
const galleryRoutes = require('./routes/gallery');
const priceRoutes = require('./routes/prices');
const userRoutes = require('./routes/users');
const pricePeriodRoutes = require('./routes/pricePeriods');

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/price-periods', pricePeriodRoutes);

// נתיבי API
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/invoices', require('./routes/invoices'));

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