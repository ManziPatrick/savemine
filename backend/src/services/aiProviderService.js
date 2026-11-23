const groqService = require('./groqService');
const apinexService = require('./apinexService');
const huggingfaceService = require('./huggingfaceService');

/**
 * AI provider router. Groq answers first. APInex is the next OpenAI-compatible
 * chat API, then Hugging Face, so a Groq outage still returns an answer.
 *
 * Strategy (env AI_PROVIDER_STRATEGY):
 *  - 'fallback'    (default) Groq, then APInex, then Hugging Face
 *  - 'round_robin' alternate Groq and APInex; the rest are still fallbacks
 *  - 'groq'        Groq first, then the same fallbacks
 *  - 'apinex'      APInex first, then Groq, then Hugging Face
 *  - 'huggingface' Hugging Face first, then Groq, then APInex
 */
const STRATEGY = (process.env.AI_PROVIDER_STRATEGY || 'fallback').toLowerCase();

let roundRobinCounter = 0;

function getPrimary() {
  if (STRATEGY === 'huggingface') return 'huggingface';
  if (STRATEGY === 'apinex') return 'apinex';
  if (STRATEGY === 'groq') return 'groq';
  if (STRATEGY === 'round_robin') {
    roundRobinCounter += 1;
    return roundRobinCounter % 2 === 0 ? 'apinex' : 'groq';
  }
  return 'groq';
}

const PROVIDERS = {
  groq: groqService,
  apinex: apinexService,
  huggingface: huggingfaceService
};

function providerOrder() {
  const primary = getPrimary();
  const rest = ['groq', 'apinex', 'huggingface'].filter((name) => name !== primary);
  return [primary, ...rest];
}

/**
 * Call chat completions through the chosen strategy.
 * Each provider keeps its own model. A model id passed in options is for that
 * call only, so a Groq model name is not forwarded to APInex.
 *
 * @param {Object} options - Same options as groqService/apinexService
 * @returns {Promise<Object>} Full completion response
 */
async function chatCompletion(options) {
  const order = providerOrder();
  const errors = [];

  for (const name of order) {
    try {
      const callOptions = name === order[0] ? options : { ...options };
      if (name !== 'groq') delete callOptions.model;
      return await PROVIDERS[name].chatCompletion(callOptions);
    } catch (err) {
      errors.push(err);
    }
  }

  const primaryError = errors[0] || new Error('No AI provider is configured.');
  const detail = errors
    .slice(1)
    .map((err) => err.message)
    .filter((message) => message && message !== primaryError.message);
  const suffix = detail.length ? ` (also failed: ${detail.join('; ')})` : '';
  throw new Error(primaryError.message + suffix);
}

module.exports = {
  chatCompletion,
  groqService,
  apinexService,
  huggingfaceService,
  PROVIDERS,
  STRATEGY,
  providerOrder,
  MISSING_KEY_MESSAGE: groqService.MISSING_KEY_MESSAGE
};
