const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Financial = require('../models/financial.model');

// קבלת כל העסקאות לחודש מסוים
router.get('/transactions', protect, async (req, res) => {
  try {
    const { month } = req.query;
    const startDate = new Date(month + '-01');
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

    const transactions = await Financial.Transaction.find({
      userId: req.user.id,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ date: -1 });

    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error('שגיאה בקבלת עסקאות:', err);
    res.status(500).json({ success: false, message: 'שגיאה בקבלת העסקאות' });
  }
});

// הוספת עסקה חדשה
router.post('/transactions', protect, async (req, res) => {
  try {
    const transaction = new Financial.Transaction({
      ...req.body,
      userId: req.user.id
    });
    await transaction.save();
    res.json({ success: true, data: transaction });
  } catch (err) {
    console.error('שגיאה בהוספת עסקה:', err);
    res.status(500).json({ success: false, message: 'שגיאה בהוספת העסקה' });
  }
});

// עדכון עסקה
router.put('/transactions/:id', protect, async (req, res) => {
  try {
    const transaction = await Financial.Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'העסקה לא נמצאה' });
    }
    res.json({ success: true, data: transaction });
  } catch (err) {
    console.error('שגיאה בעדכון עסקה:', err);
    res.status(500).json({ success: false, message: 'שגיאה בעדכון העסקה' });
  }
});

// מחיקת עסקה
router.delete('/transactions/:id', protect, async (req, res) => {
  try {
    const transaction = await Financial.Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'העסקה לא נמצאה' });
    }
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

module.exports = router; 