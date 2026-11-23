const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },
  key: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

categorySchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
