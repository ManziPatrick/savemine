const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  value: {
    type: Number,
    required: [true, 'Asset value is required'],
    min: [0, 'Value must be positive']
  },
  currency: {
    type: String,
    default: 'FRW',
    uppercase: true
  },
  category: {
    type: String,
    required: [true, 'Asset category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  status: {
    type: String,
    enum: ['owned', 'loaned', 'shared'],
    default: 'owned'
  },
  ownerContactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  proofPath: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  depreciationRate: {
    type: Number,
    min: [0, 'Depreciation rate must be positive'],
    max: [100, 'Depreciation rate cannot exceed 100%'],
    default: 0
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  serialNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Serial number cannot exceed 50 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastValuationDate: {
    type: Date,
    default: Date.now
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
assetSchema.index({ userId: 1, isActive: 1 });
assetSchema.index({ userId: 1, status: 1 });
assetSchema.index({ userId: 1, category: 1 });
assetSchema.index({ ownerContactId: 1 });

// Virtual for current value considering depreciation
assetSchema.virtual('currentValue').get(function() {
  if (!this.purchaseDate || this.depreciationRate === 0) {
    return this.value;
  }
  
  const yearsSincePurchase = (new Date() - this.purchaseDate) / (1000 * 60 * 60 * 24 * 365);
  const depreciationAmount = this.value * (this.depreciationRate / 100) * yearsSincePurchase;
  const currentValue = Math.max(0, this.value - depreciationAmount);
  
  return Math.round(currentValue);
});

// Virtual for formatted value
assetSchema.virtual('formattedValue').get(function() {
  return `${this.value.toLocaleString()} ${this.currency}`;
});

// Virtual for formatted current value
assetSchema.virtual('formattedCurrentValue').get(function() {
  return `${this.currentValue.toLocaleString()} ${this.currency}`;
});

// Method to update value
assetSchema.methods.updateValue = function(newValue, depreciationRate = null) {
  this.value = newValue;
  if (depreciationRate !== null) {
    this.depreciationRate = depreciationRate;
  }
  this.lastValuationDate = new Date();
  return this.save();
};

module.exports = mongoose.model('Asset', assetSchema);


