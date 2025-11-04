const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: false // Optional - can be general gifts
  },
  giftType: {
    type: String,
    enum: ['given', 'received', 'charity', 'donation', 'reward', 'incentive'],
    default: 'given',
    required: true
  },
  category: {
    type: String,
    enum: ['money', 'item', 'service', 'food', 'clothing', 'electronics', 'other'],
    default: 'money',
    required: true
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
  giftDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  occasion: {
    type: String,
    enum: ['birthday', 'wedding', 'graduation', 'holiday', 'anniversary', 'funeral', 'celebration', 'thank_you', 'other', 'none'],
    default: 'none'
  },
  location: {
    type: String,
    trim: true
  },
  tags: [String],
  notes: String,
  receipt: String, // URL to receipt image
  photos: [String], // URLs to gift photos
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['none', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'none'
  },
  recurringEndDate: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
giftSchema.index({ userId: 1, isActive: 1 });
giftSchema.index({ contactId: 1 });
giftSchema.index({ giftDate: 1 });
giftSchema.index({ giftType: 1, isActive: 1 });
giftSchema.index({ category: 1, isActive: 1 });
giftSchema.index({ occasion: 1, isActive: 1 });

// Virtual for calculating total value
giftSchema.virtual('totalValue').get(function() {
  if (this.quantity > 1 && this.unitPrice) {
    return this.quantity * this.unitPrice;
  }
  return this.amount;
});

// Virtual for calculating days since gift
giftSchema.virtual('daysSinceGift').get(function() {
  const today = new Date();
  const giftDate = new Date(this.giftDate);
  const diffTime = today - giftDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Gift', giftSchema);
