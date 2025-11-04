const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  businessType: {
    type: String,
    enum: ['animal_farming', 'agriculture', 'trading', 'services', 'manufacturing', 'retail', 'other'],
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
  location: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  // Animal Farming specific fields
  animals: [{
    type: {
      type: String,
      enum: ['cow', 'goat', 'sheep', 'pig', 'chicken', 'duck', 'rabbit', 'fish', 'other'],
      required: true
    },
    breed: String,
    age: Number,
    gender: {
      type: String,
      enum: ['male', 'female', 'unknown']
    },
    purchaseDate: Date,
    purchasePrice: Number,
    currentValue: Number,
    healthStatus: {
      type: String,
      enum: ['healthy', 'sick', 'pregnant', 'recovering'],
      default: 'healthy'
    },
    notes: String,
    photos: [String]
  }],
  // Financial tracking
  initialInvestment: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyExpenses: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  totalExpenses: {
    type: Number,
    default: 0,
    min: 0
  },
  // Progress tracking
  milestones: [{
    title: String,
    description: String,
    targetDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  // Growth metrics
  metrics: {
    customerCount: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    employeeCount: { type: Number, default: 0 },
    marketShare: { type: Number, default: 0 },
    satisfaction: { type: Number, min: 0, max: 10, default: 0 }
  },
  // Goals and targets
  goals: [{
    title: String,
    description: String,
    targetValue: Number,
    currentValue: Number,
    targetDate: Date,
    unit: String,
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'cancelled'],
      default: 'active'
    }
  }],
  tags: [String],
  notes: String,
  photos: [String],
  documents: [String], // URLs to business documents
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
businessSchema.index({ userId: 1, isActive: 1 });
businessSchema.index({ businessType: 1, isActive: 1 });
businessSchema.index({ status: 1, isActive: 1 });
businessSchema.index({ startDate: 1 });

// Virtual for calculating profit/loss
businessSchema.virtual('profit').get(function() {
  return this.totalRevenue - this.totalExpenses;
});

// Virtual for calculating ROI
businessSchema.virtual('roi').get(function() {
  if (this.initialInvestment === 0) return 0;
  return ((this.profit / this.initialInvestment) * 100).toFixed(2);
});

// Virtual for calculating business age in months
businessSchema.virtual('ageInMonths').get(function() {
  const today = new Date();
  const startDate = new Date(this.startDate);
  const diffTime = today - startDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
});

// Virtual for calculating monthly profit
businessSchema.virtual('monthlyProfit').get(function() {
  return this.monthlyRevenue - this.monthlyExpenses;
});

// Methods
businessSchema.methods.addAnimal = function(animalData) {
  this.animals.push(animalData);
  return this.save();
};

businessSchema.methods.updateRevenue = function(amount) {
  this.totalRevenue += amount;
  return this.save();
};

businessSchema.methods.updateExpenses = function(amount) {
  this.totalExpenses += amount;
  return this.save();
};

businessSchema.methods.addMilestone = function(milestoneData) {
  this.milestones.push({
    ...milestoneData,
    status: 'pending'
  });
  return this.save();
};

businessSchema.methods.completeMilestone = function(milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (milestone) {
    milestone.status = 'completed';
    milestone.completedDate = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('Business', businessSchema);
