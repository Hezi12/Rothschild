const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Financial = require('../models/financial.model');

// קבלת כל העסקאות לחודש מסוים או את כל העסקאות
router.get('/transactions', protect, async (req, res) => {
  try {
    console.log('------- התקבלה בקשה לקבלת עסקאות -------');
    console.log('פרמטרים:', req.query);
    console.log('משתמש:', req.user.id);
    
    const { month } = req.query;
    
    let query = { userId: req.user.id };
    
    // אם נשלח פרמטר month, נסנן לפי חודש ספציפי
    if (month) {
      const startDate = new Date(month + '-01');
      const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));
      
      query.date = {
        $gte: startDate,
        $lt: endDate
      };
      
      console.log(`מחזיר עסקאות למשתמש ${req.user.id} עבור חודש ${month}`, query);
    } else {
      console.log(`מחזיר את כל העסקאות למשתמש ${req.user.id}`);
    }

    const transactions = await Financial.Transaction.find(query).sort({ date: -1 });
    
    console.log(`נמצאו ${transactions.length} עסקאות`);
    console.log('------- סיום בקשה לקבלת עסקאות -------');
    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error('שגיאה בקבלת עסקאות:', err);
    res.status(500).json({ success: false, message: 'שגיאה בקבלת העסקאות' });
  }
});

// הוספת עסקה חדשה
router.post('/transactions', protect, async (req, res) => {
  try {
    console.log('------- התקבלה בקשה להוספת עסקה -------');
    console.log('נתוני עסקה:', {
      סוג: req.body.type,
      סכום: req.body.amount,
      קטגוריה: req.body.category,
      'שיטת תשלום': req.body.paymentMethod,
      תאריך: req.body.date
    });
    
    const transaction = new Financial.Transaction({
      ...req.body,
      userId: req.user.id
    });
    await transaction.save();
    
    console.log('העסקה נשמרה בהצלחה, מזהה:', transaction._id);
    console.log('------- סיום בקשה להוספת עסקה -------');
    res.json({ success: true, data: transaction });
  } catch (err) {
    console.error('שגיאה בהוספת עסקה:', err);
    res.status(500).json({ success: false, message: 'שגיאה בהוספת העסקה' });
  }
});

// עדכון עסקה
router.put('/transactions/:id', protect, async (req, res) => {
  try {
    console.log('------- התקבלה בקשה לעדכון עסקה -------');
    console.log('מזהה עסקה:', req.params.id);
    console.log('נתוני עדכון:', {
      סוג: req.body.type,
      סכום: req.body.amount,
      קטגוריה: req.body.category,
      'שיטת תשלום': req.body.paymentMethod,
      תאריך: req.body.date
    });
    
    const transaction = await Financial.Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!transaction) {
      console.log('העסקה לא נמצאה');
      return res.status(404).json({ success: false, message: 'העסקה לא נמצאה' });
    }
    
    console.log('העסקה עודכנה בהצלחה');
    console.log('------- סיום בקשה לעדכון עסקה -------');
    res.json({ success: true, data: transaction });
  } catch (err) {
    console.error('שגיאה בעדכון עסקה:', err);
    res.status(500).json({ success: false, message: 'שגיאה בעדכון העסקה' });
  }
});

// מחיקת עסקה
router.delete('/transactions/:id', protect, async (req, res) => {
  try {
    console.log('------- התקבלה בקשה למחיקת עסקה -------');
    console.log('מזהה עסקה למחיקה:', req.params.id);
    
    const transaction = await Financial.Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!transaction) {
      console.log('העסקה לא נמצאה');
      return res.status(404).json({ success: false, message: 'העסקה לא נמצאה' });
    }
    
    console.log('העסקה נמחקה בהצלחה:', {
      סוג: transaction.type,
      סכום: transaction.amount,
      'שיטת תשלום': transaction.paymentMethod
    });
    console.log('------- סיום בקשה למחיקת עסקה -------');
    res.json({ success: true, data: transaction });
  } catch (err) {
    console.error('שגיאה במחיקת עסקה:', err);
    res.status(500).json({ success: false, message: 'שגיאה במחיקת העסקה' });
  }
});

// קבלת קטגוריות
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await Financial.Category.findOne({ userId: req.user.id });
    res.json({ success: true, data: categories ? categories.categories : null });
  } catch (err) {
    console.error('שגיאה בקבלת קטגוריות:', err);
    res.status(500).json({ success: false, message: 'שגיאה בקבלת הקטגוריות' });
  }
});

// עדכון קטגוריות
router.put('/categories', protect, async (req, res) => {
  try {
    const categories = await Financial.Category.findOneAndUpdate(
      { userId: req.user.id },
      { categories: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: categories.categories });
  } catch (err) {
    console.error('שגיאה בעדכון קטגוריות:', err);
    res.status(500).json({ success: false, message: 'שגיאה בעדכון הקטגוריות' });
  }
});

// קבלת יתרות פתיחה
router.get('/initialBalances', protect, async (req, res) => {
  try {
    console.log('------- התקבלה בקשה לקבלת יתרות פתיחה -------');
    console.log('משתמש:', req.user.id);
    
    const initialBalances = await Financial.InitialBalance.findOne({ userId: req.user.id });
    
    if (!initialBalances) {
      console.log('לא נמצאו יתרות פתיחה למשתמש');
      return res.json({ success: true, data: {} });
    }
    
    console.log('נמצאו יתרות פתיחה:', initialBalances.balances);
    console.log('------- סיום בקשה לקבלת יתרות פתיחה -------');
    
    // המר את המפה לאובייקט JSON רגיל לשליחה
    const balancesObject = {};
    initialBalances.balances.forEach((value, key) => {
      balancesObject[key] = value;
    });
    
    res.json({ success: true, data: balancesObject });
  } catch (err) {
    console.error('שגיאה בקבלת יתרות פתיחה:', err);
    res.status(500).json({ success: false, message: 'שגיאה בקבלת יתרות פתיחה' });
  }
});

// עדכון יתרות פתיחה
router.put('/initialBalances', protect, async (req, res) => {
  try {
    console.log('------- התקבלה בקשה לעדכון יתרות פתיחה -------');
    console.log('משתמש:', req.user.id);
    console.log('נתוני עדכון:', req.body);
    
    // המר את האובייקט למפה (אם צריך)
    const balancesMap = new Map();
    Object.entries(req.body).forEach(([key, value]) => {
      balancesMap.set(key, Number(value));
    });
    
    const initialBalances = await Financial.InitialBalance.findOneAndUpdate(
      { userId: req.user.id },
      { 
        balances: balancesMap,
        lastUpdated: new Date()
      },
      { new: true, upsert: true }
    );
    
    console.log('יתרות פתיחה עודכנו בהצלחה');
    console.log('------- סיום בקשה לעדכון יתרות פתיחה -------');
    
    // המר את המפה לאובייקט JSON רגיל לשליחה
    const balancesObject = {};
    initialBalances.balances.forEach((value, key) => {
      balancesObject[key] = value;
    });
    
    res.json({ success: true, data: balancesObject });
  } catch (err) {
    console.error('שגיאה בעדכון יתרות פתיחה:', err);
    res.status(500).json({ success: false, message: 'שגיאה בעדכון יתרות פתיחה' });
  }
});

module.exports = router; 