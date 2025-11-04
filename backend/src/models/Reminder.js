const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: false // Optional - can be general reminders
  },
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: false // Optional - can be general reminders
  },
  // For custom reminders with manual phone numbers
  customContact: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  reminderType: {
    type: String,
    enum: ['loan_payment', 'general', 'follow_up', 'birthday', 'appointment'],
    default: 'general',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'sent', 'failed', 'cancelled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  sendMethod: {
    type: String,
    enum: ['sms', 'email', 'both', 'none'],
    default: 'sms'
  },
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'none'
  },
  recurrenceEndDate: Date,
  escalation: {
    enabled: {
      type: Boolean,
      default: true
    },
    levels: [{
      daysAfter: Number,
      message: String,
      sendMethod: String
    }]
  },
  sentHistory: [{
    sentAt: {
      type: Date,
      default: Date.now
    },
    method: String,
    message: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'pending']
    },
    response: String,
    cost: Number
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
reminderSchema.index({ userId: 1, isActive: 1 });
reminderSchema.index({ contactId: 1 });
reminderSchema.index({ loanId: 1 });
reminderSchema.index({ scheduledDate: 1, status: 1 });
reminderSchema.index({ reminderType: 1, isActive: 1 });

// Virtual for calculating days until reminder
reminderSchema.virtual('daysUntilReminder').get(function() {
  const today = new Date();
  const scheduled = new Date(this.scheduledDate);
  const diffTime = scheduled - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for checking if reminder is overdue
reminderSchema.virtual('isOverdue').get(function() {
  return new Date() > new Date(this.scheduledDate) && this.status === 'scheduled';
});

// Methods
reminderSchema.methods.markAsSent = function(method, message, status = 'sent', response = '', cost = 0) {
  this.sentHistory.push({
    sentAt: new Date(),
    method,
    message,
    status,
    response,
    cost
  });
  
  this.status = 'sent';
  return this.save();
};

reminderSchema.methods.scheduleNext = function() {
  if (this.recurrence === 'none') return null;
  
  const nextDate = new Date(this.scheduledDate);
  
  switch (this.recurrence) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  // Check if we've exceeded the recurrence end date
  if (this.recurrenceEndDate && nextDate > new Date(this.recurrenceEndDate)) {
    return null;
  }
  
  // Create new reminder
  const newReminder = new this.constructor({
    userId: this.userId,
    contactId: this.contactId,
    loanId: this.loanId,
    reminderType: this.reminderType,
    title: this.title,
    message: this.message,
    scheduledDate: nextDate,
    priority: this.priority,
    sendMethod: this.sendMethod,
    recurrence: this.recurrence,
    recurrenceEndDate: this.recurrenceEndDate,
    escalation: this.escalation,
    tags: this.tags,
    notes: this.notes
  });
  
  return newReminder.save();
};

module.exports = mongoose.model('Reminder', reminderSchema);