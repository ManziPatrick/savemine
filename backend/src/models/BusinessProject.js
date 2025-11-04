const mongoose = require('mongoose');

const businessProjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  capitalInvested: {
    type: Number,
    required: [true, 'Capital invested is required'],
    min: [0, 'Capital invested must be positive'],
    default: 0
  },
  currency: {
    type: String,
    default: 'FRW',
    uppercase: true
  },
  monthlyIncome: [{
    month: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format']
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Income amount must be positive']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  }],
  monthlyExpense: [{
    month: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format']
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Expense amount must be positive']
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  }],
  progressPercent: {
    type: Number,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100%'],
    default: 0
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'paused', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  teamMembers: [{
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    },
    role: {
      type: String,
      trim: true,
      maxlength: [50, 'Role cannot exceed 50 characters']
    },
    investment: {
      type: Number,
      min: [0, 'Investment must be positive'],
      default: 0
    }
  }],
  milestones: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Milestone title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    targetDate: {
      type: Date,
      required: true
    },
    completedDate: {
      type: Date
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
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
businessProjectSchema.index({ userId: 1, status: 1 });
businessProjectSchema.index({ userId: 1, deadline: 1 });
businessProjectSchema.index({ userId: 1, category: 1 });

// Virtual for total income
businessProjectSchema.virtual('totalIncome').get(function() {
  return this.monthlyIncome.reduce((sum, income) => sum + income.amount, 0);
});

// Virtual for total expenses
businessProjectSchema.virtual('totalExpenses').get(function() {
  return this.monthlyExpense.reduce((sum, expense) => sum + expense.amount, 0);
});

// Virtual for net profit
businessProjectSchema.virtual('netProfit').get(function() {
  return this.totalIncome - this.totalExpenses;
});

// Virtual for ROI percentage
businessProjectSchema.virtual('roiPercentage').get(function() {
  if (this.capitalInvested === 0) return 0;
  return ((this.netProfit / this.capitalInvested) * 100).toFixed(2);
});

// Virtual for formatted capital invested
businessProjectSchema.virtual('formattedCapitalInvested').get(function() {
  return `${this.capitalInvested.toLocaleString()} ${this.currency}`;
});

// Virtual for formatted net profit
businessProjectSchema.virtual('formattedNetProfit').get(function() {
  return `${this.netProfit.toLocaleString()} ${this.currency}`;
});

// Virtual for days until deadline
businessProjectSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.deadline) return null;
  const today = new Date();
  const diffTime = this.deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Method to add monthly income
businessProjectSchema.methods.addMonthlyIncome = function(month, amount, notes = '') {
  const existingIndex = this.monthlyIncome.findIndex(income => income.month === month);
  
  if (existingIndex >= 0) {
    this.monthlyIncome[existingIndex].amount = amount;
    this.monthlyIncome[existingIndex].notes = notes;
  } else {
    this.monthlyIncome.push({ month, amount, notes });
  }
  
  return this.save();
};

// Method to add monthly expense
businessProjectSchema.methods.addMonthlyExpense = function(month, amount, category, notes = '') {
  this.monthlyExpense.push({ month, amount, category, notes });
  return this.save();
};

// Method to update progress
businessProjectSchema.methods.updateProgress = function(percent) {
  this.progressPercent = Math.min(100, Math.max(0, percent));
  return this.save();
};

module.exports = mongoose.model('BusinessProject', businessProjectSchema);


