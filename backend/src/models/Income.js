const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
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
    default: 'General Income'
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
  // Income tracking
  incomeSources: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['salary', 'business', 'investment', 'freelance', 'other'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'one-time'],
      default: 'monthly'
    },
    lastReceived: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Transaction history
  transactions: [{
    type: {
      type: String,
      enum: ['income_received', 'loan_given', 'expense', 'transfer_out'],
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
      required: false
    },
    referenceType: {
      type: String,
      required: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Settings
  settings: {
    lowBalanceThreshold: {
      type: Number,
      default: 10000
    },
    autoReplenish: {
      type: Boolean,
      default: false
    },
    replenishAmount: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for calculating total income received
incomeSchema.virtual('totalIncomeReceived').get(function() {
  return this.transactions
    .filter(t => t.type === 'income_received')
    .reduce((sum, t) => sum + t.amount, 0);
});

// Virtual for calculating total loans given
incomeSchema.virtual('totalLoansGiven').get(function() {
  return this.transactions
    .filter(t => t.type === 'loan_given')
    .reduce((sum, t) => sum + t.amount, 0);
});

// Methods
incomeSchema.methods.addTransaction = function(type, amount, description, referenceId = null, referenceType = null) {
  this.transactions.push({
    type,
    amount,
    description,
    referenceId,
    referenceType,
    createdBy: this.userId
  });

  // Update balance based on transaction type
  if (type === 'income_received') {
    this.currentBalance += amount;
  } else if (type === 'loan_given' || type === 'expense' || type === 'transfer_out') {
    this.currentBalance -= amount;
  }

  return this.save();
};

incomeSchema.methods.canWithdraw = function(amount) {
  return this.currentBalance >= amount;
};

incomeSchema.methods.getLowBalanceAlert = function() {
  return this.currentBalance <= this.settings.lowBalanceThreshold;
};

incomeSchema.methods.addIncomeSource = function(name, type, amount, frequency = 'monthly') {
  this.incomeSources.push({
    name,
    type,
    amount,
    frequency,
    lastReceived: new Date(),
    isActive: true
  });
  return this.save();
};

// Static methods
incomeSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId, isActive: true });
};

incomeSchema.statics.createDefault = function(userId) {
  return this.create({
    userId,
    name: 'General Income',
    description: 'Default income account',
    currentBalance: 0,
    currency: 'FRW',
    incomeSources: [],
    transactions: [],
    settings: {
      lowBalanceThreshold: 10000,
      autoReplenish: false,
      replenishAmount: 0
    }
  });
};

module.exports = mongoose.model('Income', incomeSchema);






