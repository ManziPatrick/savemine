const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: [
      'food', 'transport', 'housing', 'utilities', 'healthcare', 'education',
      'entertainment', 'clothing', 'personal_care', 'business', 'animal_care',
      'agriculture', 'investment', 'emergency', 'gift', 'donation', 'other'
    ],
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
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
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  unitPrice: {
    type: Number,
    min: 0
  },
  expenseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile_money', 'bank_transfer', 'credit_card', 'other'],
    default: 'cash'
  },
  location: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    trim: true
  },
  tags: [String],
  notes: String,
  receipt: String, // URL to receipt image
  photos: [String], // URLs to expense photos
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'none'
  },
  recurringEndDate: Date,
  isBusinessExpense: {
    type: Boolean,
    default: false
  },
  isTaxDeductible: {
    type: Boolean,
    default: false
  },
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: false
  },
  // Where the money was deducted from (cash, savings, or petty_cash)
  source: {
    type: {
      type: String,
      enum: ['cash', 'savings', 'petty_cash'],
      default: 'cash'
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Savings',
      default: null
    },
    sourceName: {
      type: String,
      default: ''
    },
    amount: {
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

// Indexes
expenseSchema.index({ userId: 1, isActive: 1 });
expenseSchema.index({ expenseDate: 1 });
expenseSchema.index({ category: 1, isActive: 1 });
expenseSchema.index({ isBusinessExpense: 1, isActive: 1 });
expenseSchema.index({ isRecurring: 1, isActive: 1 });

// Virtual for calculating total value
expenseSchema.virtual('totalValue').get(function() {
  if (this.quantity > 1 && this.unitPrice) {
    return this.quantity * this.unitPrice;
  }
  return this.amount;
});

// Virtual for calculating days since expense
expenseSchema.virtual('daysSinceExpense').get(function() {
  const today = new Date();
  const expenseDate = new Date(this.expenseDate);
  const diffTime = today - expenseDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Expense', expenseSchema);
