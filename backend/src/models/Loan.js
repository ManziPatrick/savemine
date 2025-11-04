const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  loanType: {
    type: String,
    enum: ['personal', 'business', 'animal', 'emergency', 'investment'],
    default: 'personal',
    required: true
  },
  principalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // Percentage
  },
  interestType: {
    type: String,
    enum: ['simple', 'compound', 'none'],
    default: 'simple'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    required: true,
    min: 0
  },
  loanDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentFrequency: {
    type: String,
    enum: ['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'one-time'
  },
  installmentAmount: {
    type: Number,
    default: 0
  },
  paymentHistory: [{
    amount: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'mobile_money', 'bank_transfer', 'other'],
      default: 'cash'
    },
    notes: String,
    receipt: String // URL to receipt image
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'overdue', 'defaulted', 'cancelled'],
    default: 'active'
  },
  collateral: {
    description: String,
    value: Number,
    type: String, // 'asset', 'guarantor', 'document', 'other'
    details: String
  },
  notes: String,
  tags: [String],
  // Source tracking - where the loan money comes from
  source: {
    type: {
      type: String,
      enum: ['petty_cash', 'income', 'savings', 'business', 'other'],
      required: true
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // Optional - can be null for 'other' type
    },
    sourceName: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'FRW',
      enum: ['FRW', 'USD', 'EUR', 'GBP']
    }
  },
  reminderSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    daysBefore: [{
      type: Number,
      default: [7, 3, 1] // Send reminders 7, 3, and 1 days before due date
    }],
    messageTemplate: String,
    escalationEnabled: {
      type: Boolean,
      default: true
    }
  },
  lastReminderSent: Date,
  reminderCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
loanSchema.index({ userId: 1, isActive: 1 });
loanSchema.index({ contactId: 1 });
loanSchema.index({ dueDate: 1, status: 1 });
loanSchema.index({ status: 1, isActive: 1 });

// Virtual for calculating days until due
loanSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for calculating interest accrued
loanSchema.virtual('interestAccrued').get(function() {
  if (this.interestType === 'none' || this.interestRate === 0) {
    return 0;
  }
  
  const daysSinceLoan = Math.floor((new Date() - new Date(this.loanDate)) / (1000 * 60 * 60 * 24));
  const dailyRate = this.interestRate / (100 * 365);
  
  if (this.interestType === 'simple') {
    return this.principalAmount * dailyRate * daysSinceLoan;
  } else {
    // Compound interest (simplified)
    return this.principalAmount * Math.pow(1 + dailyRate, daysSinceLoan) - this.principalAmount;
  }
});

// Virtual for current total owed
loanSchema.virtual('currentTotal').get(function() {
  return this.principalAmount + this.interestAccrued;
});

// Pre-save middleware to update remaining amount
loanSchema.pre('save', function(next) {
  if (this.isModified('amountPaid')) {
    this.remainingAmount = this.totalAmount - this.amountPaid;
    
    // Update status based on remaining amount
    if (this.remainingAmount <= 0) {
      this.status = 'completed';
    } else if (new Date() > new Date(this.dueDate) && this.status === 'active') {
      this.status = 'overdue';
    }
  }
  next();
});

// Methods
loanSchema.methods.addPayment = function(amount, method = 'cash', notes = '', receipt = '') {
  this.paymentHistory.push({
    amount,
    paymentMethod: method,
    notes,
    receipt,
    paymentDate: new Date()
  });
  
  this.amountPaid += amount;
  this.remainingAmount = this.totalAmount - this.amountPaid;
  
  // Update status
  if (this.remainingAmount <= 0) {
    this.status = 'completed';
  }
  
  return this.save();
};

loanSchema.methods.calculateInterest = function() {
  if (this.interestType === 'none' || this.interestRate === 0) {
    return 0;
  }
  
  const daysSinceLoan = Math.floor((new Date() - new Date(this.loanDate)) / (1000 * 60 * 60 * 24));
  const dailyRate = this.interestRate / (100 * 365);
  
  if (this.interestType === 'simple') {
    return this.principalAmount * dailyRate * daysSinceLoan;
  } else {
    return this.principalAmount * Math.pow(1 + dailyRate, daysSinceLoan) - this.principalAmount;
  }
};

module.exports = mongoose.model('Loan', loanSchema);