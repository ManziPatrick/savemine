const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  relatedEntity: {
    type: String,
    enum: ['loan', 'contact', 'asset', 'investment', 'business', 'expense', 'gift', 'general'],
    required: true
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Can be null for general documents
  },
  documentType: {
    type: String,
    enum: [
      'receipt', 'invoice', 'contract', 'agreement', 'photo', 'identity_document',
      'proof_of_payment', 'insurance', 'warranty', 'certificate', 'report',
      'statement', 'tax_document', 'other'
    ],
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
  originalFileName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileExtension: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  notes: String,
  metadata: {
    width: Number, // For images
    height: Number, // For images
    duration: Number, // For videos/audio
    pageCount: Number, // For PDFs
    author: String,
    createdDate: Date,
    modifiedDate: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
documentSchema.index({ userId: 1, isActive: 1 });
documentSchema.index({ relatedEntity: 1, relatedEntityId: 1 });
documentSchema.index({ documentType: 1, isActive: 1 });
documentSchema.index({ uploadDate: 1 });
documentSchema.index({ expiryDate: 1 });

// Virtual for checking if document is expired
documentSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > new Date(this.expiryDate);
});

// Virtual for calculating days until expiry
documentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for calculating file size in human readable format
documentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for checking if file is an image
documentSchema.virtual('isImage').get(function() {
  return this.mimeType.startsWith('image/');
});

// Virtual for checking if file is a PDF
documentSchema.virtual('isPDF').get(function() {
  return this.mimeType === 'application/pdf';
});

// Static methods
documentSchema.statics.findByEntity = function(userId, entityType, entityId) {
  return this.find({
    userId,
    relatedEntity: entityType,
    relatedEntityId: entityId,
    isActive: true
  }).sort({ uploadDate: -1 });
};

documentSchema.statics.findByType = function(userId, documentType) {
  return this.find({
    userId,
    documentType,
    isActive: true
  }).sort({ uploadDate: -1 });
};

documentSchema.statics.findExpiring = function(userId, days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    userId,
    expiryDate: { $lte: futureDate, $gte: new Date() },
    isActive: true
  }).sort({ expiryDate: 1 });
};

// Instance methods
documentSchema.methods.generateThumbnail = function() {
  if (!this.isImage) return null;
  
  // This would be implemented with image processing library
  // For now, return the same URL
  return this.fileUrl;
};

documentSchema.methods.getDownloadUrl = function() {
  // This would generate a secure download URL
  // For now, return the file URL
  return this.fileUrl;
};

module.exports = mongoose.model('Document', documentSchema);
