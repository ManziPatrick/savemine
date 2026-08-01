const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const MISSING_KEY_MESSAGE = 'GROQ_API_KEY is not configured. Set it in the backend .env file.';

/**
 * Call Groq chat completions with optional tool (function) definitions.
 * Groq exposes an OpenAI-compatible API.
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
  const apiKey = process.env.GROQ_API_KEY;

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
    timeout: 60000 // 60s - tool loops can take a while
  };

  // Retry transient failures (rate limits, 5xx, tool-generation hiccups) with
  // backoff so the assistant survives Groq's free-tier rate limits and the
  // occasional malformed <function=...> generation during multi-step loops.
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await axios.post(GROQ_API_URL, body, config);
      return response.data;
    } catch (err) {
      const status = err.response && err.response.status;
      const groqError = err.response && err.response.data && err.response.data.error;
      // Permanent auth/permission errors (bad key, forbidden): do not retry,
      // fail over to the second AI provider immediately.
      if (status === 401 || status === 403) throw err;
      // 'tool_use_failed' (400) is a transient model-generation hiccup: the
      // model emitted <function=...> instead of JSON or called a tool that is
      // not in the provided list. Retrying usually succeeds.
      const toolUseFailed = status === 400 && groqError && groqError.code === 'tool_use_failed';
      const retryable = status === 429 || (status >= 500 && status < 600) || toolUseFailed;
      const retryAfter = err.response && err.response.headers && parseInt(err.response.headers['retry-after'], 10);
      // If the provider asks us to wait more than a minute (common on exhausted
      // free tiers), don't retry - fail over to the second AI provider via
      // aiProviderService immediately instead of hanging the chat.
      const hugeBackoff = Number.isFinite(retryAfter) && retryAfter > 60;
      if (!retryable || hugeBackoff || attempt === MAX_ATTEMPTS) throw err;

      let delayMs;
      if (toolUseFailed) {
        delayMs = 1500 * attempt; // not a rate limit - short backoff
      } else {
        // Cap the delay (max 45s) so we don't hold the chat too long.
        const base = (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : attempt * 2);
        delayMs = Math.min(base, 45) * 1000;
      }
      console.warn(`Groq API error (status ${status}${toolUseFailed ? ', tool_use_failed' : ''}), retrying in ${delayMs}ms (attempt ${attempt}/${MAX_ATTEMPTS})`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

module.exports = {
  chatCompletion,
  DEFAULT_MODEL,
  MISSING_KEY_MESSAGE
};
