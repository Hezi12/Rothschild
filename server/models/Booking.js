const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  guest: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  nights: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit', 'bank_transfer'],
    default: 'cash'
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  creditCardDetails: {
    cardNumber: String,
    cardholderName: String,
    expiry: String,
    cvv: String
  },
  isTourist: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  cancellationToken: {
    type: String,
    index: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  cancellationDate: {
    type: Date
  },
  cancellationReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// הוספת אינדקסים לשיפור ביצועים בעת חיפוש הזמנות
BookingSchema.index({ checkIn: 1, checkOut: 1 });
BookingSchema.index({ 'guest.email': 1 });
BookingSchema.index({ roomId: 1 });
BookingSchema.index({ cancellationToken: 1 });

// וידוא שתאריך צ'ק-אאוט מאוחר מתאריך צ'ק-אין
BookingSchema.pre('save', function(next) {
  if (this.checkOut <= this.checkIn) {
    return next(new Error('תאריך צ\'ק-אאוט חייב להיות מאוחר מתאריך צ\'ק-אין'));
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema); 