require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// חיבור למסד הנתונים
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('מחובר למסד הנתונים MongoDB'))
  .catch(err => {
    console.error('שגיאה בהתחברות למסד הנתונים:', err.message);
    process.exit(1);
  });

const createAdmin = async () => {
  try {
    // בדיקה אם המשתמש כבר קיים
    let admin = await User.findOne({ email: 'admin@example.com' });

    if (admin) {
      console.log('משתמש מנהל כבר קיים במערכת');
      // עדכון סיסמה של המשתמש הקיים
      admin.password = 'admin123';
      await admin.save();
      console.log('סיסמת מנהל עודכנה בהצלחה');
    } else {
      // יצירת משתמש מנהל חדש
      admin = new User({
        name: 'מנהל מערכת',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isAdmin: true,
        isSuperAdmin: true
      });

      await admin.save();
      console.log('משתמש מנהל נוצר בהצלחה');
    }

    console.log('פרטי התחברות:');
    console.log('דוא"ל: admin@example.com');
    console.log('סיסמה: admin123');

  } catch (err) {
    console.error('שגיאה ביצירת משתמש מנהל:', err.message);
  } finally {
    // סגירת החיבור למסד הנתונים
    mongoose.connection.close();
    console.log('החיבור למסד הנתונים נסגר');
  }
};

createAdmin();
