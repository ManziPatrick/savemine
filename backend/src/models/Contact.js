const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Remove all non-digit characters except +
        const cleaned = v.replace(/[^\d+]/g, '');
        
        // Check if it starts with + and has 10-15 digits after country code
        const phoneRegex = /^\+[1-9]\d{9,14}$/;
        
        // Also accept Rwanda numbers that start with +250
        const rwandaRegex = /^\+250[789]\d{8}$/;
        
        return phoneRegex.test(cleaned) || rwandaRegex.test(cleaned);
      },
      message: 'Please enter a valid phone number'
    }
  },
  type: {
    type: String,
    enum: ['debtor', 'creditor', 'partner'],
    required: [true, 'Contact type is required']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  organization: {
    type: String,
    trim: true,
    maxlength: [100, 'Organization cannot exceed 100 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }]
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index for user and phone (not unique - allows duplicates)
contactSchema.index({ userId: 1, phone: 1 });

// Index for performance
contactSchema.index({ userId: 1, type: 1 });
contactSchema.index({ userId: 1, name: 1 });

// Virtual for full contact info
contactSchema.virtual('fullInfo').get(function() {
  return `${this.name} (${this.phone}) - ${this.type}`;
});

module.exports = mongoose.model('Contact', contactSchema);
