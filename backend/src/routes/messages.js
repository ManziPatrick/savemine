const express = require('express');
const router = express.Router();
const {
  testSMS,
  getMessageLogs,
  getMessageStats,
  listDispatches,
  postDispatch,
  postCancel,
  postResend
} = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

router.get('/dispatches', listDispatches);
router.post('/dispatches', postDispatch);
router.post('/dispatches/:id/resend', postResend);
router.post('/dispatches/:id/cancel', postCancel);

// Test SMS endpoint
router.post('/test-sms', testSMS);

// Message logs
router.get('/logs', getMessageLogs);

// Message statistics
router.get('/stats', getMessageStats);

module.exports = router;



