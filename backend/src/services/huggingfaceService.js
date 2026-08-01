const axios = require('axios');

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';
const DEFAULT_MODEL = process.env.HF_MODEL || 'openai/gpt-oss-120b';
const MISSING_KEY_MESSAGE = 'HUGGINGFACE_API_KEY is not configured. Set it in the backend .env file.';

/**
 * Call Hugging Face Inference Providers (serverless router) chat completions
 * with optional tool (function) definitions. The router exposes an
 * OpenAI-compatible API, so this mirrors the Groq client.
 *
 * @param {Object} options
 * @param {Array}  options.messages       - OpenAI-style messages array
 * @param {Array}  [options.tools]        - Function tool definitions (OpenAI format)
 * @param {string} [options.toolChoice]   - 'auto' | 'none' | {type:'function', function:{name}}
 * @param {number} [options.temperature]
 * @param {number} [options.maxTokens]
 * @param {string} [options.model]
 * @returns {Promise<Object>} Full completion response
 */
async function chatCompletion({
  messages,
  tools = [],
  toolChoice = 'auto',
  temperature = 0.4,
  maxTokens = 1500,
  model = DEFAULT_MODEL
}) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new Error(MISSING_KEY_MESSAGE);
  }

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = toolChoice;
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    timeout: 90000 // 90s - serverless cold starts + tool loops can be slow
  };

  // Retry transient failures (rate limits, 5xx) with backoff.
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await axios.post(HF_API_URL, body, config);
      return response.data;
    } catch (err) {
      const status = err.response && err.response.status;
      const retryable = status === 429 || (status >= 500 && status < 600) || status === 408;
      const retryAfter = err.response && err.response.headers && parseInt(err.response.headers['retry-after'], 10);
      // If the provider asks us to wait more than a minute, don't retry -
      // fail over to the second AI provider via aiProviderService immediately.
      const hugeBackoff = Number.isFinite(retryAfter) && retryAfter > 60;
      if (!retryable || hugeBackoff || attempt === MAX_ATTEMPTS) throw err;

      // Cap the delay (max 45s) so a heavily rate-limited provider fails over
      // quickly to the other AI provider instead of hanging the chat.
      const base = (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : attempt * 2);
      const delayMs = Math.min(base, 45) * 1000;
      console.warn(`HuggingFace API error (status ${status}), retrying in ${delayMs}ms (attempt ${attempt}/${MAX_ATTEMPTS})`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

module.exports = {
  chatCompletion,
  DEFAULT_MODEL,
  MISSING_KEY_MESSAGE
};
