const mongoose = require('mongoose');

const pettyCashSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Petty Cash'
  },
  description: {
    type: String,
    trim: true
  },
  currentBalance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'FRW',
    enum: ['FRW', 'USD', 'EUR', 'GBP']
  },
  // Transaction history
  transactions: [{
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'loan_given', 'loan_repaid', 'expense', 'income'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // Reference to loan, expense, etc.
    },
    referenceType: {
      type: String,
      enum: ['loan', 'expense', 'income', 'manual'],
      required: false
    },
    date: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  // Settings
  settings: {
    lowBalanceThreshold: {
      type: Number,
      default: 10000 // Alert when balance goes below this amount
    },
    autoReplenish: {
      enabled: {
        type: Boolean,
        default: false
      },
      amount: {
        type: Number,
        default: 50000
      },
      source: {
        type: String,
        enum: ['savings', 'business', 'income'],
        default: 'savings'
      }
    }
  },
  tags: [String],
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
pettyCashSchema.index({ userId: 1, isActive: 1 });
pettyCashSchema.index({ 'transactions.date': -1 });

// Virtual for calculating total deposits
pettyCashSchema.virtual('totalDeposits').get(function() {
  return this.transactions
    .filter(t => t.type === 'deposit' || t.type === 'loan_repaid' || t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
});

// Virtual for calculating total withdrawals
pettyCashSchema.virtual('totalWithdrawals').get(function() {
  return this.transactions
    .filter(t => t.type === 'withdrawal' || t.type === 'loan_given' || t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
});

// Methods
pettyCashSchema.methods.addTransaction = function(type, amount, description, referenceId = null, referenceType = null) {
  this.transactions.push({
    type,
    amount,
    description,
    referenceId,
    referenceType,
    createdBy: this.userId
  });

  // Update balance based on transaction type
  if (type === 'deposit' || type === 'loan_repaid' || type === 'income') {
    this.currentBalance += amount;
  } else if (type === 'withdrawal' || type === 'loan_given' || type === 'expense') {
    this.currentBalance -= amount;
  }

  return this.save();
};

pettyCashSchema.methods.canWithdraw = function(amount) {
  return this.currentBalance >= amount;
};

pettyCashSchema.methods.getLowBalanceAlert = function() {
  return this.currentBalance <= this.settings.lowBalanceThreshold;
};

// Static methods
pettyCashSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId, isActive: true });
};

pettyCashSchema.statics.createDefault = function(userId) {
  return this.create({
    userId,
    name: 'Petty Cash',
    description: 'Default petty cash account',
    currentBalance: 0,
    currency: 'FRW'
  });
};

module.exports = mongoose.model('PettyCash', pettyCashSchema);

