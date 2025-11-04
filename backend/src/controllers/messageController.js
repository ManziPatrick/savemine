const messageService = require('../services/messageService.mista');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Test SMS sending
 * @route   POST /messages/test-sms
 * @access  Private
 */
const testSMS = asyncHandler(async (req, res) => {
  const { phone, message } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  try {
    // Format phone number
    const formattedPhone = messageService.formatRwandaPhone(phone);

    // Validate phone number
    if (!messageService.validatePhone(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please use international format (e.g., +250788123456)'
      });
    }

    // Send SMS (with error handling)
    let result;
    try {
      result = await messageService.sendSMS(formattedPhone, message);
      
      // Log message with userId if not already logged by service
      if (!result.logged) {
        await messageService.logMessage({
          phone: formattedPhone,
          message: message,
          channel: 'sms',
          status: result.success ? 'sent' : 'failed',
          providerResponse: result.data || result,
          responseTime: result.responseTime || 0,
          attempts: result.attempts || 1,
          errorMessage: result.error || null,
          userId: req.user._id
        });
      }
    } catch (error) {
      // Log failed attempt
      await messageService.logMessage({
        phone: formattedPhone,
        message: message,
        channel: 'sms',
        status: 'failed',
        providerResponse: error.response?.data || error.message,
        responseTime: 0,
        attempts: 1,
        errorMessage: error.message,
        userId: req.user._id
      });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send SMS',
        error: error.message,
        details: error.response?.data || null
      });
    }

    if (result.success) {
      res.json({
        success: true,
        message: 'SMS sent successfully',
        data: {
          phone: formattedPhone,
          messageId: result.data?.id || result.data?.message_id || result.data?.sid,
          status: 'sent',
          response: result.data
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send SMS',
        error: result.error || 'Unknown error',
        details: result.data
      });
    }
  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send SMS',
      error: error.message
    });
  }
});

/**
 * @desc    Get message logs
 * @route   GET /messages/logs
 * @access  Private
 */
const getMessageLogs = asyncHandler(async (req, res) => {
  const MessageLog = require('../models/MessageLog');
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const logs = await MessageLog.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await MessageLog.countDocuments({ userId: req.user._id });

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get message statistics
 * @route   GET /messages/stats
 * @access  Private
 */
const getMessageStats = asyncHandler(async (req, res) => {
  const MessageLog = require('../models/MessageLog');

  const stats = await MessageLog.aggregate([
    { $match: { userId: req.user._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalSent = await MessageLog.countDocuments({
    userId: req.user._id,
    status: 'sent'
  });

  const totalFailed = await MessageLog.countDocuments({
    userId: req.user._id,
    status: 'failed'
  });

  res.json({
    success: true,
    data: {
      totalSent,
      totalFailed,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    }
  });
});

module.exports = {
  testSMS,
  getMessageLogs,
  getMessageStats
};
