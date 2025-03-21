const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * מודל פשוט להזמנות בדף SimpleBookingList
 * מיועד לשמירת הזמנות פשוטות בלי לוגיקה מורכבת
 */

const SimpleBookingSchema = new Schema({
  // מידע בסיסי
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    enum: ['rothschild', 'oryehuda'],
    required: true
  },
  roomId: {
    type: String, 
    required: true
  },
  guestName: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  nights: {
    type: Number,
    default: 1,
    min: 1
  },
  isPaid: {
    type: Boolean,
    default: false
  },

  // חותמות זמן
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// אינדקסים למהירות חיפוש
SimpleBookingSchema.index({ date: 1, location: 1, roomId: 1 });

const SimpleBooking = mongoose.model('SimpleBooking', SimpleBookingSchema);
module.exports = SimpleBooking; 