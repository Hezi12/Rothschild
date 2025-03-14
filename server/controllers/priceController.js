const DynamicPrice = require('../models/DynamicPrice');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { startOfDay, endOfDay, parseISO, format } = require('date-fns');

// @desc    קבלת מחירים דינמיים לחדר או חדרים בטווח תאריכים
// @route   GET /api/prices
// @access  Private/Admin
exports.getDynamicPrices = async (req, res) => {
  try {
    const { roomId, startDate, endDate } = req.query;
    
    let query = {};
    
    // אם יש מזהה חדר ספציפי, סנן רק לחדר זה
    if (roomId) {
      query.room = roomId;
    }
    
    // אם יש טווח תאריכים, סנן לפי טווח
    if (startDate && endDate) {
      query.date = {
        $gte: startOfDay(new Date(startDate)),
        $lte: endOfDay(new Date(endDate))
      };
    }
    
    const prices = await DynamicPrice.find(query).sort({ date: 1 });
    
    res.json({
      success: true,
      count: prices.length,
      data: prices
    });
  } catch (error) {
    console.error('שגיאה בקבלת מחירים דינמיים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    עדכון מחיר דינמי לחדר ספציפי ביום ספציפי
// @route   POST /api/prices
// @access  Private/Admin
exports.setDynamicPrice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { roomId, date, price } = req.body;

  try {
    // וידוא שהחדר קיים
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'החדר לא נמצא'
      });
    }

    // הפיכת המחיר למספר אם הוא מגיע כמחרוזת
    const numericPrice = Number(price);
    
    // וידוא שהמחיר הוא מספר חיובי
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'המחיר חייב להיות מספר חיובי'
      });
    }

    // חיפוש מחיר קיים עבור החדר והתאריך
    let dynamicPrice = await DynamicPrice.findOne({
      room: roomId,
      date: startOfDay(new Date(date))
    });

    if (dynamicPrice) {
      // עדכון מחיר קיים
      dynamicPrice.price = numericPrice;
      dynamicPrice.updatedAt = Date.now();
      await dynamicPrice.save();
    } else {
      // יצירת רשומת מחיר חדשה
      dynamicPrice = new DynamicPrice({
        room: roomId,
        date: startOfDay(new Date(date)),
        price: numericPrice
      });
      await dynamicPrice.save();
    }

    res.json({
      success: true,
      data: dynamicPrice
    });
  } catch (error) {
    console.error('שגיאה בעדכון מחיר דינמי:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    עדכון מחירים דינמיים בצורה גורפת לטווח תאריכים או חדרים
// @route   PUT /api/prices/bulk
// @access  Private/Admin
exports.bulkUpdatePrices = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { roomIds, startDate, endDate, price, daysOfWeek, specialPrices } = req.body;
  
  // לוג מפורט של הנתונים שהתקבלו
  console.log('bulkUpdatePrices נתונים שהתקבלו:', {
    roomIds,
    startDate,
    endDate,
    price,
    daysOfWeek,
    specialPrices: JSON.stringify(specialPrices)
  });

  try {
    // וידוא שהפרמטרים תקינים
    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'נדרש לפחות חדר אחד'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'נדרשים תאריך התחלה ותאריך סיום'
      });
    }

    // המרת תאריכים לאובייקטי Date
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    // וידוא שסדר התאריכים הגיוני
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'תאריך ההתחלה חייב להיות לפני תאריך הסיום'
      });
    }

    // וידוא שהחדרים קיימים
    const rooms = await Room.find({ _id: { $in: roomIds } });
    if (rooms.length !== roomIds.length) {
      return res.status(400).json({
        success: false,
        message: 'אחד או יותר מהחדרים לא נמצאו'
      });
    }

    // וידוא שה-specialPrices קיים ותקין
    if (!specialPrices || typeof specialPrices !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'פורמט מחירים מיוחדים לא תקין'
      });
    }

    // מערך תוצאות לשמירת כל המחירים שעודכנו
    const updatedPrices = [];

    // עבור כל חדר, עדכן את המחירים בטווח התאריכים
    for (const roomId of roomIds) {
      // איפוס מחירים קיימים בטווח התאריכים
      await DynamicPrice.deleteMany({
        room: roomId,
        date: { $gte: start, $lte: end }
      });

      // יצירת תאריכי ביניים בין תאריך ההתחלה לתאריך הסיום
      const dates = [];
      let currentDate = new Date(start);
      
      while (currentDate <= end) {
        // קבלת היום בשבוע
        const dayOfWeek = currentDate.getDay(); // 0 = ראשון, 1 = שני, וכו'
        
        // בדיקה אם היום הנוכחי נכלל בימים שצוינו
        if (!daysOfWeek || daysOfWeek.includes(dayOfWeek)) {
          // קביעת המחיר בהתאם ליום בשבוע אם מוגדרים מחירים מיוחדים
          let currentPrice = price;
          
          // אם ניתנו מחירים ספציפיים לימים, השתמש בהם
          // המפתח יכול להיות מחרוזת או מספר
          const dayKey = dayOfWeek.toString();
          
          if (specialPrices && (specialPrices[dayOfWeek] !== undefined || specialPrices[dayKey] !== undefined)) {
            currentPrice = specialPrices[dayOfWeek] !== undefined ? specialPrices[dayOfWeek] : specialPrices[dayKey];
            console.log(`יום ${dayOfWeek}, מחיר מיוחד: ${currentPrice}`);
          }
          
          // וידוא שהמחיר הוא מספר חיובי
          const numericPrice = Number(currentPrice);
          if (!isNaN(numericPrice) && numericPrice > 0) {
            // יצירת רשומת מחיר חדשה
            const dynamicPrice = new DynamicPrice({
              room: roomId,
              date: new Date(currentDate),
              price: numericPrice
            });
            
            await dynamicPrice.save();
            updatedPrices.push(dynamicPrice);
          } else {
            console.log(`דילוג על יום ${dayOfWeek} כי המחיר אינו תקין: ${currentPrice}`);
          }
        }
        
        // התקדם ליום הבא
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    res.json({
      success: true,
      count: updatedPrices.length,
      message: `עודכנו ${updatedPrices.length} מחירים`
    });
  } catch (error) {
    console.error('שגיאה בעדכון גורף של מחירים:', error);
    res.status(500).json({ 
      success: false, 
      message: `שגיאת שרת: ${error.message}` 
    });
  }
};

// @desc    מחיקת מחיר דינמי
// @route   DELETE /api/prices/:id
// @access  Private/Admin
exports.deleteDynamicPrice = async (req, res) => {
  try {
    const dynamicPrice = await DynamicPrice.findById(req.params.id);
    
    if (!dynamicPrice) {
      return res.status(404).json({
        success: false,
        message: 'המחיר הדינמי לא נמצא'
      });
    }
    
    await dynamicPrice.deleteOne();
    
    res.json({
      success: true,
      message: 'המחיר הדינמי נמחק בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה במחיקת מחיר דינמי:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    איפוס מחירים דינמיים (החזרה למחיר הבסיסי)
// @route   DELETE /api/prices/reset
// @access  Private/Admin
exports.resetDynamicPrices = async (req, res) => {
  const { roomId, startDate, endDate } = req.body;
  
  try {
    let query = {};
    
    // אם יש מזהה חדר ספציפי, סנן רק לחדר זה
    if (roomId) {
      query.room = roomId;
    }
    
    // אם יש טווח תאריכים, סנן לפי טווח
    if (startDate && endDate) {
      query.date = {
        $gte: startOfDay(new Date(startDate)),
        $lte: endOfDay(new Date(endDate))
      };
    }
    
    const result = await DynamicPrice.deleteMany(query);
    
    res.json({
      success: true,
      count: result.deletedCount,
      message: `אופסו ${result.deletedCount} מחירים דינמיים`
    });
  } catch (error) {
    console.error('שגיאה באיפוס מחירים דינמיים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
}; 