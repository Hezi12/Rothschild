const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * מודל הזמנה מחודש ומשופר
 * הבעיות שתוקנו: 
 * 1. אין יותר כפילות בין הזמנות לחסימות (הזמנה היא הזמנה)
 * 2. טיפול שגוי באזורי זמן
 * 3. מבנה הגיוני יותר של שדות
 */

// סכמה ייעודית לפרטי כרטיס אשראי
const CreditCardSchema = new Schema({
  cardNumber: {
    type: String,
    trim: true,
    default: '',
    required: false
  },
  expiryDate: {
    type: String,
    default: '',
    required: false
  },
  cvv: {
    type: String,
    default: '',
    required: false
  },
  cardholderName: {
    type: String,
    default: '',
    required: false
  }
}, { _id: false }); // מניעת יצירת ID עצמאי

const BookingSchema = new Schema({
  // מידע בסיסי
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: function() {
      // שדה חובה רק אם אין מספר חדרים
      return !this.rooms || this.rooms.length === 0;
    }
  },
  // תמיכה בהזמנת מספר חדרים
  rooms: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Room'
    }],
    default: undefined
  },
  // האם זוהי הזמנה של מספר חדרים
  isMultiRoomBooking: {
    type: Boolean,
    default: false 
  },
  // מספר החדרים המוזמנים
  totalRooms: {
    type: Number,
    default: function() {
      if (this.rooms && this.rooms.length > 0) {
        return this.rooms.length;
      }
      return 1;
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'canceled', 'completed'],
    default: 'pending'
  },
  
  // תאריכים (בלי בעיות אזור זמן) - שומרים בפורמט ללא שעה
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  
  // מחירים וחיובים
  nights: {
    type: Number,
    required: true,
    min: 1
  },
  basePrice: {
    type: Number,
    default: 400
  },
  vatRate: {
    type: Number,
    default: 18
  },
  vatAmount: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  isTourist: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['credit', 'cash', 'creditOr', 'creditRothschild', 'mizrahi', 'poalim', 'other', ''],
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'canceled'],
    default: 'pending'
  },
  
  // פרטי האורח
  guest: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'ישראל'
    },
    idNumber: String,
    notes: String
  },
  
  // פרטי כרטיס אשראי - חשוב: שימוש בסכמה נפרדת עם ערכי ברירת מחדל
  creditCard: {
    type: CreditCardSchema,
    default: () => ({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    }),
    required: false
  },
  
  // מידע נוסף
  source: {
    type: String,
    enum: ['direct', 'website', 'booking.com', 'airbnb', 'expedia', 'other'],
    default: 'direct'
  },
  sourceReference: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
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
  
  // הגדרות מודל
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// וידוא שתאריך צ'ק-אאוט מאוחר מתאריך צ'ק-אין
BookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // מוודא שהתאריכים תקינים
  if (!this.checkIn || !this.checkOut) {
    return next(new Error('נדרשים תאריכי צ\'ק-אין וצ\'ק-אאוט'));
  }
  
  // איפוס שעה בתאריכים כדי להימנע מבעיות אזור זמן
  const checkInDate = new Date(this.checkIn);
  checkInDate.setHours(0, 0, 0, 0);
  this.checkIn = checkInDate;
  
  const checkOutDate = new Date(this.checkOut);
  checkOutDate.setHours(0, 0, 0, 0);
  this.checkOut = checkOutDate;
  
  // בדיקה שצ'ק-אאוט אחרי צ'ק-אין
  if (this.checkOut <= this.checkIn) {
    return next(new Error('תאריך צ\'ק-אאוט חייב להיות לאחר תאריך צ\'ק-אין'));
  }
  
  // וידוא שפרטי כרטיס אשראי לא יהיו undefined
  if (!this.creditCard) {
    this.creditCard = {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    };
  } else {
    // וידוא שכל השדות קיימים וערכיהם מאותחלים
    this.creditCard.cardNumber = this.creditCard.cardNumber || '';
    this.creditCard.expiryDate = this.creditCard.expiryDate || '';
    this.creditCard.cvv = this.creditCard.cvv || '';
    this.creditCard.cardholderName = this.creditCard.cardholderName || '';
  }
  
  next();
});

// טיפול מיוחד בעדכון כרטיס אשראי
BookingSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // אם יש עדכון לכרטיס אשראי, וודא שכל השדות קיימים
  if (update.$set && update.$set.creditCard) {
    const creditCard = update.$set.creditCard;
    
    // וידוא שכל השדות קיימים
    update.$set.creditCard = {
      cardNumber: creditCard.cardNumber || '',
      expiryDate: creditCard.expiryDate || '',
      cvv: creditCard.cvv || '',
      cardholderName: creditCard.cardholderName || ''
    };
    
    console.log('כרטיס אשראי לאחר טיפול במידלוור:', update.$set.creditCard);
  }
  
  next();
});

// פונקציה וירטואלית לבדיקה אם הזמנה חופפת לתאריך מסוים
BookingSchema.virtual('isDateOverlapping').get(function() {
  return function(date) {
    if (!date) return false;
    
    // איפוס שעה בתאריך הבדיקה
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // בדיקת תאריך 
    return (
      checkDate >= this.checkIn && 
      checkDate < this.checkOut &&
      this.status !== 'canceled'
    );
  };
});

// אינדקסים למהירות חיפוש
BookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ bookingNumber: 1 });
BookingSchema.index({ 'guest.name': 1 });
BookingSchema.index({ 'guest.email': 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ paymentStatus: 1 });

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = Booking; 