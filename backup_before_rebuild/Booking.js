const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: Number,
    unique: true
  },
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
BookingSchema.pre('save', async function(next) {
  if (this.checkOut <= this.checkIn) {
    return next(new Error('תאריך צ\'ק-אאוט חייב להיות מאוחר מתאריך צ\'ק-אין'));
  }

  // אם אין מספר הזמנה, יצירת מספר הזמנה חדש
  if (!this.bookingNumber) {
    try {
      // מציאת המספר הגבוה ביותר הקיים
      const highestBooking = await this.constructor.findOne({}, { bookingNumber: 1 })
        .sort({ bookingNumber: -1 });
      
      // קביעת מספר הזמנה חדש (1001 התחלתי או הגדלה ב-1)
      this.bookingNumber = highestBooking && highestBooking.bookingNumber ? highestBooking.bookingNumber + 1 : 1001;
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

module.exports = mongoose.model('Booking', BookingSchema); 