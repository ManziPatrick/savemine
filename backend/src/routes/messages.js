const express = require('express');
const router = express.Router();
const {
  testSMS,
  getMessageLogs,
  getMessageStats
} = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Test SMS endpoint
router.post('/test-sms', testSMS);

// Message logs
router.get('/logs', getMessageLogs);

// Message statistics
router.get('/stats', getMessageStats);

module.exports = router;



