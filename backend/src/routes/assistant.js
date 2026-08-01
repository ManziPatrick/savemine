const express = require('express');
const router = express.Router();
const {
  chat,
  getMessages,
  clearMessages
} = require('../controllers/assistantController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.post('/chat', chat);
router.get('/messages', getMessages);
router.delete('/messages', clearMessages);

module.exports = router;
