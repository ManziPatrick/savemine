const mongoose = require('mongoose');

const assetAssignmentSchema = new mongoose.Schema({
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
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: false // Optional - can be general assignments
  },
  assignmentType: {
    type: String,
    enum: ['loan', 'rental', 'temporary', 'permanent', 'maintenance', 'storage', 'other'],
    required: true
  },
  assetDescription: {
    type: String,
    required: true,
    trim: true
  },
  assetCategory: {
    type: String,
    enum: ['vehicle', 'equipment', 'property', 'livestock', 'electronics', 'furniture', 'tools', 'other'],
    required: true
  },
  assetValue: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'FRW',
    enum: ['FRW', 'USD', 'EUR', 'GBP']
  },
  assignmentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedReturnDate: {
    type: Date,
    required: false
  },
  actualReturnDate: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue', 'lost', 'damaged', 'cancelled'],
    default: 'active'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
    default: 'excellent'
  },
  // Financial terms
  depositAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  rentalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentFrequency: {
    type: String,
    enum: ['one-time', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'one-time'
  },
  // Location tracking
  currentLocation: {
    type: String,
    trim: true
  },
  originalLocation: {
    type: String,
    trim: true
  },
  // Documentation
  contract: {
    type: String, // URL to contract document
    terms: String,
    conditions: String
  },
  photos: [String], // URLs to photos
  documents: [String], // URLs to other documents
  // Tracking
  checkInHistory: [{
    date: Date,
    location: String,
    condition: String,
    notes: String,
    photos: [String]
  }],
  paymentHistory: [{
    date: Date,
    amount: Number,
    paymentMethod: String,
    notes: String
  }],
  // Reminders and follow-up
  reminders: [{
    date: Date,
    type: {
      type: String,
      enum: ['check_in', 'payment', 'return', 'maintenance'],
      default: 'check_in'
    },
    message: String,
    status: {
      type: String,
      enum: ['pending', 'sent', 'completed'],
      default: 'pending'
    }
  }],
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
assetAssignmentSchema.index({ userId: 1, isActive: 1 });
assetAssignmentSchema.index({ contactId: 1 });
assetAssignmentSchema.index({ assetId: 1 });
assetAssignmentSchema.index({ assignmentType: 1, isActive: 1 });
assetAssignmentSchema.index({ status: 1, isActive: 1 });
assetAssignmentSchema.index({ assignmentDate: 1 });
assetAssignmentSchema.index({ expectedReturnDate: 1 });

// Virtual for calculating days since assignment
assetAssignmentSchema.virtual('daysSinceAssignment').get(function() {
  const today = new Date();
  const assignmentDate = new Date(this.assignmentDate);
  const diffTime = today - assignmentDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for calculating days until return
assetAssignmentSchema.virtual('daysUntilReturn').get(function() {
  if (!this.expectedReturnDate) return null;
  const today = new Date();
  const returnDate = new Date(this.expectedReturnDate);
  const diffTime = returnDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for checking if assignment is overdue
assetAssignmentSchema.virtual('isOverdue').get(function() {
  if (!this.expectedReturnDate || this.status !== 'active') return false;
  return new Date() > new Date(this.expectedReturnDate);
});

// Virtual for calculating total payments received
assetAssignmentSchema.virtual('totalPaymentsReceived').get(function() {
  return this.paymentHistory.reduce((total, payment) => total + payment.amount, 0);
});

// Methods
assetAssignmentSchema.methods.addCheckIn = function(location, condition, notes = '', photos = []) {
  this.checkInHistory.push({
    date: new Date(),
    location,
    condition,
    notes,
    photos
  });
  
  this.currentLocation = location;
  this.condition = condition;
  
  return this.save();
};

assetAssignmentSchema.methods.addPayment = function(amount, paymentMethod, notes = '') {
  this.paymentHistory.push({
    date: new Date(),
    amount,
    paymentMethod,
    notes
  });
  
  return this.save();
};

assetAssignmentSchema.methods.markAsReturned = function(returnDate, condition, notes = '') {
  this.actualReturnDate = returnDate || new Date();
  this.status = 'returned';
  this.condition = condition;
  this.notes = notes;
  
  return this.save();
};

assetAssignmentSchema.methods.addReminder = function(date, type, message) {
  this.reminders.push({
    date,
    type,
    message,
    status: 'pending'
  });
  
  return this.save();
};

assetAssignmentSchema.methods.completeReminder = function(reminderId) {
  const reminder = this.reminders.id(reminderId);
  if (reminder) {
    reminder.status = 'completed';
  }
  return this.save();
};

module.exports = mongoose.model('AssetAssignment', assetAssignmentSchema);
