const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  guest: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
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
  isTourist: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  cancellationDate: {
    type: Date
  },
  cancellationFee: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit', 'bank_transfer'],
    default: 'credit'
  },
  creditCardDetails: {
    cardNumber: {
      type: String
    },
    expiryDate: {
      type: String
    },
    cvv: {
      type: String
    }
  },
  notes: {
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
});

// וידוא שתאריך צ'ק-אאוט מאוחר מתאריך צ'ק-אין
BookingSchema.pre('save', function(next) {
  if (this.checkOut <= this.checkIn) {
    return next(new Error('תאריך צ\'ק-אאוט חייב להיות מאוחר מתאריך צ\'ק-אין'));
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema); 