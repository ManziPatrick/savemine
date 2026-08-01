const mongoose = require('mongoose');

/**
 * Project — generic "my project" tracking.
 * The owner (user) creates any project they own and records:
 *  - Expenses (costs) with a reason for every amount spent
 *  - Income (outcomes/revenue) from the project
 * The model computes total spent, total income, profit and ROI.
 */
const expenseItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Expense category is required'],
    trim: true
  },
  reason: {
    type: String,
    required: [true, 'Reason is required for every expense'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  vendor: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const incomeItemSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String,
    required: [true, 'Income title is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Income amount is required'],
    min: 0
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    trim: true
  },
  customer: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  projectType: {
    type: String,
    default: 'general',
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedEndDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'paused', 'completed', 'cancelled'],
    default: 'planning'
  },
  plannedBudget: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'FRW',
    enum: ['FRW', 'USD', 'EUR', 'GBP']
  },
  // Money spent with a reason for each expense
  expenses: [expenseItemSchema],
  // Income / outcomes recorded by the owner
  incomes: [incomeItemSchema],
  tags: [String],
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
projectSchema.index({ userId: 1, isActive: 1 });
projectSchema.index({ userId: 1, status: 1, isActive: 1 });
projectSchema.index({ userId: 1, projectType: 1, isActive: 1 });

// Virtual: total money spent on this project
projectSchema.virtual('totalExpenses').get(function () {
  return this.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
});

// Virtual: total income from this project
projectSchema.virtual('totalIncome').get(function () {
  return this.incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
});

// Virtual: profit = income - expenses
projectSchema.virtual('profit').get(function () {
  return this.totalIncome - this.totalExpenses;
});

// Virtual: profit margin (%)
projectSchema.virtual('profitMargin').get(function () {
  if (this.totalIncome === 0) return 0;
  return ((this.profit / this.totalIncome) * 100).toFixed(2);
});

// Virtual: ROI (%)
projectSchema.virtual('roiPercentage').get(function () {
  if (this.totalExpenses === 0) return 0;
  return ((this.profit / this.totalExpenses) * 100).toFixed(2);
});

// Method: add an expense
projectSchema.methods.addExpense = function (expenseData) {
  this.expenses.push(expenseData);
  return this.save();
};

module.exports = mongoose.model('Project', projectSchema);
