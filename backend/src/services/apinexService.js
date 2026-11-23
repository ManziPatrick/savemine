const axios = require('axios');

const APINEX_API_URL = process.env.APINEX_API_URL || 'https://api.apinex.bond/v1/chat/completions';
const DEFAULT_MODEL = process.env.APINEX_MODEL || 'free/glm-5.3-flash';
const MISSING_KEY_MESSAGE = 'APINEX_API_KEY is not configured. Set it in the backend .env file.';

/**
 * Call APInex chat completions. The API is OpenAI-compatible, same shape the
 * assistant already uses with Groq, including tool calls.
 *
 * @param {Object} options
 * @param {Array}  options.messages
 * @param {Array}  [options.tools]
 * @param {string} [options.toolChoice]
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
  model
}) {
  const apiKey = process.env.APINEX_API_KEY;
  const modelId = model || process.env.APINEX_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error(MISSING_KEY_MESSAGE);
  }

  const body = {
    model: modelId,
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
      Authorization: `Bearer ${apiKey}`
    },
    timeout: 60000
  };

  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await axios.post(APINEX_API_URL, body, config);
      return response.data;
    } catch (err) {
      const status = err.response && err.response.status;
      const providerError = err.response && err.response.data && err.response.data.error;
      if (status === 401 || status === 403 || status === 400) throw err;
      const retryable = status === 429 || (status >= 500 && status < 600);
      const retryAfter = err.response && err.response.headers && parseInt(err.response.headers['retry-after'], 10);
      const hugeBackoff = Number.isFinite(retryAfter) && retryAfter > 60;
      if (!retryable || hugeBackoff || attempt === MAX_ATTEMPTS) throw err;

      const base = (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : attempt * 2);
      const delayMs = Math.min(base, 45) * 1000;
      const code = providerError && providerError.code ? `, ${providerError.code}` : '';
      console.warn(`APInex API error (status ${status}${code}), retrying in ${delayMs}ms (attempt ${attempt}/${MAX_ATTEMPTS})`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

module.exports = {
  chatCompletion,
  DEFAULT_MODEL,
  MISSING_KEY_MESSAGE
};
