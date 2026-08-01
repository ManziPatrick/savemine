const ChatMessage = require('../models/ChatMessage');
const { asyncHandler } = require('../middleware/errorHandler');
const { runAssistant } = require('../services/assistantService');

const HISTORY_LIMIT = 20;

/**
 * @desc    Chat with the AI assistant
 * @route   POST /assistant/chat
 * @access  Private
 */
const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }

  const trimmed = message.trim();

  // Persist the user's message
  const userMessage = await ChatMessage.create({
    userId: req.user._id,
    role: 'user',
    content: trimmed
  });

  // Load recent conversation history (most recent first, then reverse)
  const history = await ChatMessage.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT);

  const messages = history
    .slice()
    .reverse()
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  // Run the assistant loop
  let reply;
  let actions;
  try {
    const result = await runAssistant(req.user, messages);
    reply = result.reply;
    actions = result.actions;
  } catch (error) {
    // Don't leave a dangling user message without a reply in history
    await ChatMessage.deleteOne({ _id: userMessage._id });
    console.error('Assistant chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'The assistant could not process your message. Please try again.'
    });
  }

  // Persist the assistant's reply
  const assistantMessage = await ChatMessage.create({
    userId: req.user._id,
    role: 'assistant',
    content: reply,
    actions
  });

  res.json({
    success: true,
    data: {
      reply,
      actions,
      userMessage: { id: userMessage._id, role: 'user', content: userMessage.content },
      assistantMessage: { id: assistantMessage._id, role: 'assistant', content: assistantMessage.content, actions }
    }
  });
});

/**
 * @desc    Get conversation history
 * @route   GET /assistant/messages
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({ userId: req.user._id })
    .sort({ createdAt: 1 })
    .limit(100);

  res.json({
    success: true,
    data: messages
  });
});

/**
 * @desc    Clear conversation history
 * @route   DELETE /assistant/messages
 * @access  Private
 */
const clearMessages = asyncHandler(async (req, res) => {
  await ChatMessage.deleteMany({ userId: req.user._id });

  res.json({
    success: true,
    message: 'Conversation history cleared'
  });
});

module.exports = {
  chat,
  getMessages,
  clearMessages
};
