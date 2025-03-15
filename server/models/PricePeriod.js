const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * מודל תקופות תמחור - מחליף את הלוגיקה של "מחירים דינמיים"
 * מאפשר הגדרת תקופות עם מחירים שונים (עונות, חגים, אירועים מיוחדים)
 */
const PricePeriodSchema = new Schema({
  // שם התקופה (למשל "קיץ 2023", "חגי תשרי", "סופי שבוע")
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // תקופת התחלה וסיום
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // האם התקופה חלה על חדרים ספציפיים או על כולם
  applyToAllRooms: {
    type: Boolean,
    default: true
  },
  
  // רשימת חדרים ספציפיים אם לא חל על כולם
  rooms: [{
    type: Schema.Types.ObjectId,
    ref: 'Room'
  }],
  
  // ערך התמחור - יכול להיות אחוז שינוי או מחיר קבוע
  pricingType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  
  // ערך התמחור - אחוז שינוי (חיובי או שלילי) או מחיר קבוע
  pricingValue: {
    type: Number,
    required: true
  },
  
  // סדר עדיפות - כאשר יש כמה תקופות חופפות, זו עם העדיפות הגבוהה יותר תחול
  priority: {
    type: Number,
    default: 10
  },
  
  // הגדרות חזרה (עבור "כל יום שישי" וכדומה)
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    daysOfWeek: [{
      type: Number,  // 0=ראשון, 1=שני, ... 6=שבת
      min: 0,
      max: 6
    }]
  },
  
  // חותמות זמן
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // פעיל/לא פעיל
  isActive: {
    type: Boolean,
    default: true
  },

  roomTypes: [{
    type: String,
    enum: ['standard', 'deluxe', 'suite', 'simple', 'simple_with_balcony', 'standard_with_balcony'],
    required: true
  }],

  priceMultiplier: {
    type: Number,
    required: true,
    min: 0.1,
    max: 10,
    default: 1
  }
});

// וידוא שתאריך סיום מאוחר מתאריך התחלה
PricePeriodSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // איפוס שעה בתאריכים
  if (this.startDate) {
    const startDate = new Date(this.startDate);
    startDate.setHours(0, 0, 0, 0);
    this.startDate = startDate;
  }
  
  if (this.endDate) {
    const endDate = new Date(this.endDate);
    endDate.setHours(23, 59, 59, 999);
    this.endDate = endDate;
  }
  
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    return next(new Error('תאריך סיום חייב להיות מאוחר מתאריך התחלה'));
  }
  
  next();
});

// אינדקסים למהירות חיפוש
PricePeriodSchema.index({ startDate: 1, endDate: 1 });
PricePeriodSchema.index({ rooms: 1 });
PricePeriodSchema.index({ isActive: 1 });

const PricePeriod = mongoose.model('PricePeriod', PricePeriodSchema);
module.exports = PricePeriod; 