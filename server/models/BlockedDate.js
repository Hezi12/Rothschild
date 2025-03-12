const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// סכמה של תאריך חסום
const BlockedDateSchema = new Schema({
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // שדה חדש - מזהה הזמנה קשורה (אם יש)
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  // מקור חיצוני (אם יש)
  externalSource: {
    type: String,
    default: null
  },
  // פרטי אורח (למקרה של סנכרון מ-booking.com)
  guestDetails: {
    name: String,
    email: String,
    phone: String,
    notes: String
  }
});

// וידוא שתאריך סיום מאוחר מתאריך התחלה
BlockedDateSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('תאריך סיום חייב להיות מאוחר מתאריך התחלה'));
  }
  next();
});

// אינדקס לחיפוש מהיר
BlockedDateSchema.index({ room: 1, startDate: 1, endDate: 1 });
// אינדקס לחיפוש לפי הזמנה
BlockedDateSchema.index({ bookingId: 1 });

const BlockedDate = mongoose.model('BlockedDate', BlockedDateSchema);
module.exports = BlockedDate; 