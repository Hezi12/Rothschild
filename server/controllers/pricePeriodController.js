const PricePeriod = require('../models/PricePeriod');
const { validationResult } = require('express-validator');

// @desc    קבלת כל תקופות המחירים
// @route   GET /api/price-periods
// @access  Public
exports.getPricePeriods = async (req, res) => {
  try {
    const pricePeriods = await PricePeriod.find().sort({ startDate: 1 });
    
    res.json({
      success: true,
      count: pricePeriods.length,
      data: pricePeriods
    });
  } catch (error) {
    console.error('שגיאה בקבלת תקופות מחירים:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    קבלת תקופת מחיר לפי מזהה
// @route   GET /api/price-periods/:id
// @access  Public
exports.getPricePeriodById = async (req, res) => {
  try {
    const pricePeriod = await PricePeriod.findById(req.params.id);
    
    if (!pricePeriod) {
      return res.status(404).json({
        success: false,
        message: 'תקופת המחיר לא נמצאה'
      });
    }
    
    res.json({
      success: true,
      data: pricePeriod
    });
  } catch (error) {
    console.error('שגיאה בקבלת תקופת מחיר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    יצירת תקופת מחיר חדשה
// @route   POST /api/price-periods
// @access  Private/Admin
exports.createPricePeriod = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    const { name, startDate, endDate, roomTypes, priceMultiplier } = req.body;
    
    // בדיקה אם טווח התאריכים תקין
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'תאריך ההתחלה חייב להיות לפני תאריך הסיום'
      });
    }
    
    const pricePeriod = new PricePeriod({
      name,
      startDate,
      endDate,
      roomTypes,
      priceMultiplier
    });
    
    const savedPricePeriod = await pricePeriod.save();
    
    res.status(201).json({
      success: true,
      data: savedPricePeriod,
      message: 'תקופת המחיר נוצרה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה ביצירת תקופת מחיר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    עדכון תקופת מחיר
// @route   PUT /api/price-periods/:id
// @access  Private/Admin
exports.updatePricePeriod = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    const pricePeriod = await PricePeriod.findById(req.params.id);
    
    if (!pricePeriod) {
      return res.status(404).json({
        success: false,
        message: 'תקופת המחיר לא נמצאה'
      });
    }
    
    // עדכון השדות שנשלחו
    const { name, startDate, endDate, roomTypes, priceMultiplier } = req.body;
    
    if (name) pricePeriod.name = name;
    if (startDate) pricePeriod.startDate = startDate;
    if (endDate) pricePeriod.endDate = endDate;
    if (roomTypes) pricePeriod.roomTypes = roomTypes;
    if (priceMultiplier) pricePeriod.priceMultiplier = priceMultiplier;
    
    // בדיקה אם טווח התאריכים תקין
    if (new Date(pricePeriod.startDate) >= new Date(pricePeriod.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'תאריך ההתחלה חייב להיות לפני תאריך הסיום'
      });
    }
    
    const updatedPricePeriod = await pricePeriod.save();
    
    res.json({
      success: true,
      data: updatedPricePeriod,
      message: 'תקופת המחיר עודכנה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה בעדכון תקופת מחיר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
};

// @desc    מחיקת תקופת מחיר
// @route   DELETE /api/price-periods/:id
// @access  Private/Admin
exports.deletePricePeriod = async (req, res) => {
  try {
    const pricePeriod = await PricePeriod.findById(req.params.id);
    
    if (!pricePeriod) {
      return res.status(404).json({
        success: false,
        message: 'תקופת המחיר לא נמצאה'
      });
    }
    
    await pricePeriod.remove();
    
    res.json({
      success: true,
      message: 'תקופת המחיר נמחקה בהצלחה'
    });
  } catch (error) {
    console.error('שגיאה במחיקת תקופת מחיר:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת' 
    });
  }
}; 