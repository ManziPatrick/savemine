const axios = require('axios');
const MessageLog = require('../models/MessageLog');

class MistaMessageService {
  constructor() {
    // Use only the specified endpoint and token
    this.apiUrl = 'https://api.mista.io/sms';
    this.apiKey = '667|K2XEOiGKnoZZxF4EFFRPJio8RmDrQYb7XfraseMi';
    this.senderId = process.env.MISTA_SENDER_ID || process.env.SMS_SENDER_NAME || 'SmartMoney';
    
    console.log('✅ Mista API configured with SMS endpoint');
  }

  /**
   * Send SMS via Mista API
   * @param {string} phone - Phone number (with country code)
   * @param {string} message - Message content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Provider response
   */
  async sendSMS(phone, message, options = {}) {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    // Internal bookkeeping fields must NOT leak into the provider request body
    const { userId, reminderId, sender, ...apiOptions } = options;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        
        const response = await axios.post(
          this.apiUrl,
          {
            to: phone,
            from: sender || this.senderId,
            message: message,
            ...apiOptions
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 30000 // 30 second timeout
          }
        );

        const responseTime = Date.now() - startTime;
        
        // Log successful send
        await this.logMessage({
          phone,
          message,
          channel: 'sms',
          status: 'sent',
          providerResponse: response.data,
          responseTime,
          attempts,
          userId: options.userId,
          reminderId: options.reminderId
        });

        return {
          success: true,
          provider: 'mista',
          messageId: response.data?.id || response.data?.message_id || null,
          data: response.data,
          attempts,
          responseTime
        };

      } catch (error) {
        lastError = error;
        const responseTime = Date.now() - startTime;
        
        // Log failed attempt
        await this.logMessage({
          phone,
          message,
          channel: 'sms',
          status: 'failed',
          providerResponse: error.response?.data || error.message,
          responseTime,
          attempts,
          errorMessage: error.message,
          userId: options.userId,
          reminderId: options.reminderId
        });

        // If this is not the last attempt, wait with exponential backoff
        if (attempts < maxAttempts) {
          const delay = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s
          await this.sleep(delay);
        }
      }
    }

    // All Mista attempts failed - fall back to Pindo (second messaging method)
    const pindoService = require('./pindoService');
    if (pindoService.configured) {
      console.warn(`Mista SMS failed after ${maxAttempts} attempts (${lastError.message}). Falling back to Pindo...`);
      try {
        // Pass the raw sender (undefined lets Pindo use its own default sender,
        // e.g. PINDO_SENDER_ID=PindoTest). An explicit sender still passes through.
        const pindoResult = await pindoService.sendSMS(phone, message, sender);
        const responseTime = Date.now() - startTime;
        await this.logMessage({
          phone,
          message,
          channel: 'sms',
          status: 'sent',
          providerResponse: { provider: 'pindo', ...pindoResult.data },
          responseTime,
          attempts: attempts + 1,
          userId: options.userId,
          reminderId: options.reminderId
        });
        return {
          success: true,
          provider: 'pindo',
          messageId: pindoResult.messageId,
          data: pindoResult.data,
          attempts: attempts + 1,
          responseTime
        };
      } catch (pindoError) {
        throw new Error(`Failed to send SMS (Mista: ${lastError.message}; Pindo: ${pindoError.message})`);
      }
    }

    throw new Error(`Failed to send SMS after ${maxAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Send WhatsApp message via Mista API
   * @param {string} phone - Phone number (with country code)
   * @param {string} message - Message content or template
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Provider response
   */
  async sendWhatsApp(phone, message, options = {}) {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    // Internal bookkeeping fields must NOT leak into the provider request body
    const { userId, reminderId, sender, ...apiOptions } = options;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        
        const response = await axios.post(
          'https://api.mista.io/whatsapp',
          {
            to: phone,
            from: sender || this.senderId,
            message: message,
            ...apiOptions
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 30000
          }
        );

        const responseTime = Date.now() - startTime;
        
        // Log successful send
        await this.logMessage({
          phone,
          message,
          channel: 'whatsapp',
          status: 'sent',
          providerResponse: response.data,
          responseTime,
          attempts
        });

        return {
          success: true,
          data: response.data,
          attempts,
          responseTime
        };

      } catch (error) {
        lastError = error;
        const responseTime = Date.now() - startTime;
        
        // Log failed attempt
        await this.logMessage({
          phone,
          message,
          channel: 'whatsapp',
          status: 'failed',
          providerResponse: error.response?.data || error.message,
          responseTime,
          attempts,
          errorMessage: error.message
        });

        // Exponential backoff
        if (attempts < maxAttempts) {
          const delay = Math.pow(2, attempts) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Failed to send WhatsApp message after ${maxAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Send message via multiple channels
   * @param {string} phone - Phone number
   * @param {string} message - Message content
   * @param {Array} channels - Channels to send to ['sms', 'whatsapp']
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Results for each channel
   */
  async sendMultiChannel(phone, message, channels = ['sms'], options = {}) {
    const results = {};
    
    for (const channel of channels) {
      try {
        if (channel === 'sms') {
          results.sms = await this.sendSMS(phone, message, options);
        } else if (channel === 'whatsapp') {
          results.whatsapp = await this.sendWhatsApp(phone, message, options);
        }
      } catch (error) {
        results[channel] = {
          success: false,
          error: error.message
        };
      }
    }
    
    return results;
  }

  /**
   * Log message to database
   * @param {Object} logData - Message log data
   */
  async logMessage(logData) {
    try {
      const messageLog = new MessageLog({
        phone: logData.phone,
        message: logData.message,
        channel: logData.channel,
        status: logData.status,
        providerResponse: logData.providerResponse,
        responseTime: logData.responseTime,
        attempts: logData.attempts,
        errorMessage: logData.errorMessage,
        userId: logData.userId,
        reminderId: logData.reminderId
      });
      
      await messageLog.save();
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  }

  /**
   * Get message delivery status
   * @param {string} messageId - Message ID from provider
   * @returns {Promise<Object>} - Delivery status
   */
  async getDeliveryStatus(messageId) {
    try {
      const response = await axios.get(
        `https://api.mista.io/messages/${messageId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get delivery status: ${error.message}`);
    }
  }

  /**
   * Get account balance
   * @returns {Promise<Object>} - Account information
   */
  async getAccountBalance() {
    try {
      const response = await axios.get(
        'https://api.mista.io/account/balance',
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  /**
   * Sleep utility for delays
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - Is valid
   */
  validatePhone(phone) {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Check if it starts with + and has 10-15 digits after country code
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Format phone number for Rwanda
   * @param {string} phone - Phone number
   * @returns {string} - Formatted phone number
   */
  formatRwandaPhone(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 250, it's already formatted
    if (cleaned.startsWith('250')) {
      return '+' + cleaned;
    }
    
    // If it starts with 0, replace with +250
    if (cleaned.startsWith('0')) {
      return '+250' + cleaned.substring(1);
    }
    
    // If it's 9 digits, add +250
    if (cleaned.length === 9) {
      return '+250' + cleaned;
    }
    
    return phone; // Return as-is if we can't format it
  }
}

// Create singleton instance
const messageService = new MistaMessageService();

module.exports = messageService;


