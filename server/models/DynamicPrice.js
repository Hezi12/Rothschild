const mongoose = require('mongoose');

const DynamicPriceSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// יצירת אינדקס משולב על חדר ותאריך
DynamicPriceSchema.index({ room: 1, date: 1 }, { unique: true });

// עדכון תאריך העדכון האחרון בכל שמירה
DynamicPriceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DynamicPrice', DynamicPriceSchema); 