const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  name: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  sentAt: Date,
  error: { type: String, default: '' }
}, { _id: false });

const dispatchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: {
    type: String,
    enum: ['loan', 'bill', 'gift', 'follow_up', 'general'],
    default: 'general'
  },
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', default: null },
  message: { type: String, required: true, trim: true, maxlength: 480 },
  schedule: {
    type: String,
    enum: ['now', 'date', 'weekly', 'monthly', 'yearly'],
    default: 'now'
  },
  scheduledDate: Date,
  nextSendAt: Date,
  status: {
    type: String,
    enum: ['scheduled', 'sent', 'partial', 'failed'],
    default: 'scheduled'
  },
  recipients: [recipientSchema],
  sentCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

dispatchSchema.index({ userId: 1, nextSendAt: 1, status: 1 });

module.exports = mongoose.model('Dispatch', dispatchSchema);
