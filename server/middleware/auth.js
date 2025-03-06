const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware לאימות טוקן JWT
exports.protect = async (req, res, next) => {
  let token;

  // בדיקה אם יש טוקן בכותרת Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // אם אין טוקן, החזר שגיאה
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'אין הרשאה לגשת למשאב זה, נדרשת התחברות' 
    });
  }

  try {
    // אימות הטוקן
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // מציאת המשתמש לפי המזהה בטוקן
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'המשתמש לא נמצא' 
      });
    }

    // הוספת המשתמש לאובייקט הבקשה
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'טוקן לא תקין או פג תוקף' 
    });
  }
};

// Middleware לבדיקת הרשאות מנהל
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'אין הרשאת מנהל לגשת למשאב זה' 
    });
  }
}; 