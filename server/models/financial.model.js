const mongoose = require('mongoose');

// סכמה לעסקאות
const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  complex: {
    type: String,
    enum: ['rothschild', 'extraRooms'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: [
      'cash',
      'creditRothschild',
      'creditExtraRooms',
      'bankTransferRothschild',
      'bankTransferExtraRooms',
      'bitRothschild',
      'bitExtraRooms',
      'payboxRothschild',
      'payboxExtraRooms'
    ],
    required: true
  }
}, {
  timestamps: true
});

// סכמה לקטגוריות
const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  complex: {
    type: String,
    enum: ['rothschild', 'extraRooms'],
    required: true
  },
  categories: {
    type: Object,
    default: {
      expenses: [],
      income: []
    }
  }
}, {
  timestamps: true
});

// סכמה ליתרות פתיחה לשיטות תשלום
const initialBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  complex: {
    type: String,
    enum: ['rothschild', 'extraRooms'],
    required: true
  },
  balances: {
    type: Map,
    of: Number,
    default: {}
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);
const Category = mongoose.model('Category', categorySchema);
const InitialBalance = mongoose.model('InitialBalance', initialBalanceSchema);

module.exports = {
  Transaction,
  Category,
  InitialBalance
}; 