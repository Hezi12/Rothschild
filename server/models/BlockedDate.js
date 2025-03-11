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
  }
});

// וידוא שתאריך סיום מאוחר מתאריך התחלה
BlockedDateSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('תאריך סיום חייב להיות מאוחר מתאריך התחלה'));
  }
  next();
});

const BlockedDate = mongoose.model('BlockedDate', BlockedDateSchema);
module.exports = BlockedDate; 