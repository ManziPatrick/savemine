const mongoose = require('mongoose');

// Movement history — records every deposit/withdrawal with a date, so trends can be built
const movementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  balanceAfter: {
    type: Number
  }
}, { _id: false });

const savingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Savings name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  location: {
    type: String,
    enum: ['SACCO', 'MTN MoMo', 'Bank', 'Cash'],
    required: [true, 'Savings location is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive'],
    default: 0
  },
  currency: {
    type: String,
    default: 'FRW',
    uppercase: true
  },
  targetAmount: {
    type: Number,
    min: [0, 'Target amount must be positive']
  },
  targetDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  accountNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Account number cannot exceed 50 characters']
  },
  interestRate: {
    type: Number,
    min: [0, 'Interest rate must be positive'],
    max: [100, 'Interest rate cannot exceed 100%']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  movements: [movementSchema]
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
savingsSchema.index({ userId: 1, isActive: 1 });
savingsSchema.index({ userId: 1, location: 1 });

// Virtual for progress percentage
savingsSchema.virtual('progressPercentage').get(function() {
  if (!this.targetAmount || this.targetAmount === 0) return 0;
  return Math.round((this.amount / this.targetAmount) * 100);
});

// Virtual for formatted amount
savingsSchema.virtual('formattedAmount').get(function() {
  return `${this.amount.toLocaleString()} ${this.currency}`;
});

// Virtual for formatted target amount
savingsSchema.virtual('formattedTargetAmount').get(function() {
  if (!this.targetAmount) return 'No target set';
  return `${this.targetAmount.toLocaleString()} ${this.currency}`;
});

// Virtual for days to target
savingsSchema.virtual('daysToTarget').get(function() {
  if (!this.targetDate) return null;
  const today = new Date();
  const diffTime = this.targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Method to add amount (records a deposit movement)
savingsSchema.methods.addAmount = function(amount, notes = '') {
  this.amount += amount;
  this.lastUpdated = new Date();
  this.movements.push({
    type: 'deposit',
    amount,
    date: new Date(),
    notes,
    balanceAfter: this.amount
  });
  return this.save();
};

// Method to withdraw amount (records a withdrawal movement)
savingsSchema.methods.withdrawAmount = function(amount, notes = '') {
  if (amount > this.amount) {
    throw new Error('Insufficient funds');
  }
  this.amount -= amount;
  this.lastUpdated = new Date();
  this.movements.push({
    type: 'withdrawal',
    amount,
    date: new Date(),
    notes,
    balanceAfter: this.amount
  });
  return this.save();
};

module.exports = mongoose.model('Savings', savingsSchema);


