const groqService = require('./groqService');
const huggingfaceService = require('./huggingfaceService');

/**
 * AI provider router: shares load between Groq and Hugging Face so token usage
 * and rate limits are spread across both services.
 *
 * Strategy (env AI_PROVIDER_STRATEGY):
 *  - 'fallback'    (default) try Groq first, fall back to HF on any error
 *  - 'round_robin' alternate the primary provider on each call; fall back to
 *                   the other on error (best for spreading token usage evenly)
 *  - 'huggingface' force HF only
 *  - 'groq'        force Groq only
 */
const STRATEGY = (process.env.AI_PROVIDER_STRATEGY || 'fallback').toLowerCase();

let roundRobinCounter = 0;

function getPrimary() {
  if (STRATEGY === 'huggingface') return 'huggingface';
  if (STRATEGY === 'groq') return 'groq';
  if (STRATEGY === 'round_robin') {
    roundRobinCounter += 1;
    return roundRobinCounter % 2 === 0 ? 'groq' : 'huggingface';
  }
  return 'groq';
}

const PROVIDERS = {
  groq: groqService,
  huggingface: huggingfaceService
};

/**
 * Call chat completions through the chosen strategy.
 *
 * @param {Object} options - Same options as groqService/huggingfaceService
 * @returns {Promise<Object>} Full completion response
 */
async function chatCompletion(options) {
  const primary = getPrimary();
  const secondary = primary === 'groq' ? 'huggingface' : 'groq';

  try {
    return await PROVIDERS[primary].chatCompletion(options);
  } catch (primaryError) {
    // Fall back to the other provider
    try {
      return await PROVIDERS[secondary].chatCompletion(options);
    } catch (secondaryError) {
      // Surface the primary error (more actionable for the user)
      const detail = secondaryError.message && secondaryError.message !== primaryError.message
        ? ` (both providers failed: ${primaryError.message}; ${secondaryError.message})`
        : '';
      throw new Error(primaryError.message + detail);
    }
  }
}

module.exports = {
  chatCompletion,
  groqService,
  huggingfaceService,
  PROVIDERS,
  STRATEGY,
  MISSING_KEY_MESSAGE: groqService.MISSING_KEY_MESSAGE
};
