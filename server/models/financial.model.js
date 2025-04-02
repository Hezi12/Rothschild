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
  paymentMethod: {
    type: String,
    enum: [
      'cash', 'מזומן',
      'creditOr', 'אשראי אור יהודה',
      'creditRothschild', 'אשראי רוטשילד',
      'mizrahi', 'העברה מזרחי',
      'bitMizrahi', 'ביט מזרחי',
      'payboxMizrahi', 'פייבוקס מזרחי',
      'poalim', 'העברה פועלים',
      'bitPoalim', 'ביט פועלים',
      'payboxPoalim', 'פייבוקס פועלים',
      'other', 'אחר'
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
  // מפה של שיטת תשלום -> יתרה התחלתית
  balances: {
    type: Map,
    of: Number,
    default: {}
  },
  // תאריך עדכון אחרון
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