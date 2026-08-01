const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  // Optional structured summary of actions the assistant took (tool calls executed)
  actions: [{
    tool: String,
    status: {
      type: String,
      enum: ['success', 'error']
    },
    summary: String
  }]
}, {
  timestamps: true
});

// Index for fetching recent history per user
chatMessageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
