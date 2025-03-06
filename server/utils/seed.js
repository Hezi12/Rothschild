const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Room = require('../models/Room');

// טעינת משתני סביבה
dotenv.config();

// חיבור למסד הנתונים
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('חיבור למסד הנתונים הצליח'))
.catch(err => {
  console.error('שגיאה בחיבור למסד הנתונים:', err);
  process.exit(1);
});

// יצירת משתמש אדמין
const createAdmin = async () => {
  try {
    // בדיקה אם כבר קיים משתמש אדמין
    const adminExists = await User.findOne({ email: 'diamshotels@gmail.com' });
    
    if (adminExists) {
      console.log('משתמש אדמין כבר קיים');
      return;
    }
    
    // יצירת משתמש אדמין חדש
    const admin = new User({
      name: 'מנהל מלונית',
      email: 'diamshotels@gmail.com',
      password: 'Hezi3225',
      role: 'admin'
    });
    
    await admin.save();
    console.log('משתמש אדמין נוצר בהצלחה');
  } catch (error) {
    console.error('שגיאה ביצירת משתמש אדמין:', error);
  }
};

// יצירת חדר סטנדרט
const createStandardRoom = async () => {
  try {
    // בדיקה אם כבר קיים חדר 6
    const roomExists = await Room.findOne({ roomNumber: 6 });
    
    if (roomExists) {
      console.log('חדר 6 כבר קיים');
      return;
    }
    
    // יצירת חדר סטנדרט חדש
    const room = new Room({
      roomNumber: 6,
      type: 'standard',
      basePrice: 400,
      maxOccupancy: 2,
      description: 'חדר סטנדרט נעים ונוח, מתאים לזוגות או ליחידים.',
      amenities: ['מיזוג אוויר', 'טלוויזיה', 'מקרר', 'מקלחת', 'Wi-Fi'],
      images: [
        {
          url: 'https://res.cloudinary.com/demo/image/upload/v1/rothschild79/rooms/room6_1.jpg',
          publicId: 'rothschild79/rooms/room6_1'
        },
        {
          url: 'https://res.cloudinary.com/demo/image/upload/v1/rothschild79/rooms/room6_2.jpg',
          publicId: 'rothschild79/rooms/room6_2'
        },
        {
          url: 'https://res.cloudinary.com/demo/image/upload/v1/rothschild79/rooms/room6_3.jpg',
          publicId: 'rothschild79/rooms/room6_3'
        }
      ]
    });
    
    await room.save();
    console.log('חדר 6 נוצר בהצלחה');
  } catch (error) {
    console.error('שגיאה ביצירת חדר:', error);
  }
};

// הרצת פונקציות יצירת הנתונים
const seedData = async () => {
  await createAdmin();
  await createStandardRoom();
  
  // ניתוק ממסד הנתונים
  mongoose.disconnect();
  console.log('תהליך יצירת הנתונים הסתיים');
};

// הרצת הסקריפט
seedData(); 