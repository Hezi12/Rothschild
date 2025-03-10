const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

// וידוא שתאריך הסיום הוא לאחר תאריך ההתחלה
BlockedDateSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('תאריך סיום החסימה חייב להיות מאוחר מתאריך ההתחלה'));
  } else {
    next();
  }
});

// אינדקס על תאריכים ומזהה חדר לחיפושים מהירים
BlockedDateSchema.index({ room: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('BlockedDate', BlockedDateSchema); 