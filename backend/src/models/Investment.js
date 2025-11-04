const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  investmentType: {
    type: String,
    enum: ['savings', 'stocks', 'bonds', 'real_estate', 'crypto', 'business', 'animals', 'agriculture', 'other'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  symbol: {
    type: String,
    trim: true // For stocks, crypto, etc.
  },
  initialAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentValue: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'FRW',
    enum: ['FRW', 'USD', 'EUR', 'GBP']
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  maturityDate: {
    type: Date,
    required: false
  },
  interestRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // Percentage
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'matured', 'cancelled', 'transferred'],
    default: 'active'
  },
  // For recurring investments
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringAmount: {
    type: Number,
    min: 0
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  // Performance tracking
  performanceHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    value: Number,
    return: Number,
    returnPercentage: Number,
    notes: String
  }],
  // Dividends/Returns
  dividends: [{
    date: Date,
    amount: Number,
    type: {
      type: String,
      enum: ['dividend', 'interest', 'capital_gain', 'distribution'],
      default: 'dividend'
    },
    notes: String
  }],
  // Fees and costs
  fees: [{
    date: Date,
    amount: Number,
    type: {
      type: String,
      enum: ['management', 'transaction', 'maintenance', 'other'],
      default: 'management'
    },
    description: String
  }],
  // Goals and targets
  targetAmount: {
    type: Number,
    min: 0
  },
  targetDate: Date,
  targetReturn: {
    type: Number,
    min: 0
  },
  // Location/Details
  location: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  broker: {
    type: String,
    trim: true
  },
  tags: [String],
  notes: String,
  documents: [String], // URLs to investment documents
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
investmentSchema.index({ userId: 1, isActive: 1 });
investmentSchema.index({ investmentType: 1, isActive: 1 });
investmentSchema.index({ status: 1, isActive: 1 });
investmentSchema.index({ startDate: 1 });
investmentSchema.index({ maturityDate: 1 });

// Virtual for calculating total return
investmentSchema.virtual('totalReturn').get(function() {
  return this.currentValue - this.initialAmount;
});

// Virtual for calculating return percentage
investmentSchema.virtual('returnPercentage').get(function() {
  if (this.initialAmount === 0) return 0;
  return ((this.totalReturn / this.initialAmount) * 100).toFixed(2);
});

// Virtual for calculating investment duration in days
investmentSchema.virtual('durationInDays').get(function() {
  const today = new Date();
  const startDate = new Date(this.startDate);
  const diffTime = today - startDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for calculating time until maturity
investmentSchema.virtual('daysUntilMaturity').get(function() {
  if (!this.maturityDate) return null;
  const today = new Date();
  const maturity = new Date(this.maturityDate);
  const diffTime = maturity - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for calculating annualized return
investmentSchema.virtual('annualizedReturn').get(function() {
  if (this.initialAmount === 0 || this.durationInDays === 0) return 0;
  const years = this.durationInDays / 365;
  return (((this.currentValue / this.initialAmount) ** (1 / years) - 1) * 100).toFixed(2);
});

// Virtual for checking if investment is mature
investmentSchema.virtual('isMature').get(function() {
  if (!this.maturityDate) return false;
  return new Date() >= new Date(this.maturityDate);
});

// Virtual for checking if target is reached
investmentSchema.virtual('isTargetReached').get(function() {
  if (!this.targetAmount) return false;
  return this.currentValue >= this.targetAmount;
});

// Methods
investmentSchema.methods.updateValue = function(newValue, notes = '') {
  const oldValue = this.currentValue;
  this.currentValue = newValue;
  
  // Add to performance history
  this.performanceHistory.push({
    date: new Date(),
    value: newValue,
    return: newValue - this.initialAmount,
    returnPercentage: ((newValue - this.initialAmount) / this.initialAmount) * 100,
    notes
  });
  
  return this.save();
};

investmentSchema.methods.addDividend = function(amount, type = 'dividend', notes = '') {
  this.dividends.push({
    date: new Date(),
    amount,
    type,
    notes
  });
  
  // Update current value if it's a reinvestment
  if (type === 'dividend') {
    this.currentValue += amount;
  }
  
  return this.save();
};

investmentSchema.methods.addFee = function(amount, type = 'management', description = '') {
  this.fees.push({
    date: new Date(),
    amount,
    type,
    description
  });
  
  // Update current value if fee is deducted
  this.currentValue -= amount;
  
  return this.save();
};

investmentSchema.methods.calculateProjectedValue = function(targetDate) {
  if (!this.interestRate || this.interestRate === 0) return this.currentValue;
  
  const daysUntilTarget = Math.ceil((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24));
  const dailyRate = this.interestRate / (100 * 365);
  
  return this.currentValue * Math.pow(1 + dailyRate, daysUntilTarget);
};

module.exports = mongoose.model('Investment', investmentSchema);
