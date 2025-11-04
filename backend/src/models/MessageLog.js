const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  reminderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reminder',
    index: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  channel: {
    type: String,
    enum: ['sms', 'whatsapp', 'email'],
    required: [true, 'Channel is required']
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending', 'delivered'],
    required: [true, 'Status is required']
  },
  providerResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  providerMessageId: {
    type: String,
    trim: true
  },
  responseTime: {
    type: Number, // in milliseconds
    min: [0, 'Response time must be positive']
  },
  attempts: {
    type: Number,
    min: [1, 'Attempts must be at least 1'],
    default: 1
  },
  errorMessage: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    min: [0, 'Cost must be positive']
  },
  currency: {
    type: String,
    default: 'FRW',
    uppercase: true
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

// Indexes for performance and analytics
messageLogSchema.index({ userId: 1, createdAt: -1 });
messageLogSchema.index({ reminderId: 1 });
messageLogSchema.index({ channel: 1, status: 1 });
messageLogSchema.index({ createdAt: -1 });
messageLogSchema.index({ phone: 1 });

// Virtual for formatted response time
messageLogSchema.virtual('formattedResponseTime').get(function() {
  if (!this.responseTime) return 'N/A';
  return `${this.responseTime}ms`;
});

// Virtual for success rate calculation
messageLogSchema.virtual('isSuccessful').get(function() {
  return this.status === 'sent' || this.status === 'delivered';
});

// Static method to get message statistics
messageLogSchema.statics.getStats = function(userId = null, dateRange = null) {
  const match = {};
  
  if (userId) {
    match.userId = userId;
  }
  
  if (dateRange) {
    match.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          channel: '$channel',
          status: '$status'
        },
        count: { $sum: 1 },
        totalCost: { $sum: '$cost' },
        avgResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $group: {
        _id: '$_id.channel',
        totalMessages: { $sum: '$count' },
        successfulMessages: {
          $sum: {
            $cond: [
              { $in: ['$_id.status', ['sent', 'delivered']] },
              '$count',
              0
            ]
          }
        },
        totalCost: { $sum: '$totalCost' },
        avgResponseTime: { $avg: '$avgResponseTime' },
        statusBreakdown: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        }
      }
    },
    {
      $addFields: {
        successRate: {
          $cond: [
            { $gt: ['$totalMessages', 0] },
            { $multiply: [{ $divide: ['$successfulMessages', '$totalMessages'] }, 100] },
            0
          ]
        }
      }
    }
  ]);
};

// Static method to find failed messages for retry
messageLogSchema.statics.findFailedMessages = function(hours = 24) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    status: 'failed',
    createdAt: { $gte: cutoffTime },
    attempts: { $lt: 3 }
  }).populate('userId reminderId');
};

// Static method to get user message history
messageLogSchema.statics.getUserHistory = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('reminderId', 'title modelType modelId');
};

module.exports = mongoose.model('MessageLog', messageLogSchema);


