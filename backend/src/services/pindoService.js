const axios = require('axios');

/**
 * Pindo SMS service (https://pindo.io).
 * Second messaging method alongside Mista - used as a fallback provider.
 *
 * Endpoints (from official docs):
 *  - Single: POST {PINDO_API_URL}/v1/sms/  body { to, text, sender }
 *  - Bulk:   POST {PINDO_API_URL}/v1/sms/bulk  body { recipients: [{phonenumber}], text, sender }
 */
class PindoService {
  constructor() {
    this.apiUrl = (process.env.PINDO_API_URL || 'https://api.pindo.io').replace(/\/+$/, '');
    this.apiToken = process.env.PINDO_API_TOKEN;
    this.defaultSender = process.env.PINDO_SENDER_ID || 'PindoTest';

    if (this.apiToken) {
      console.log('✅ Pindo API configured (SMS fallback provider)');
    }
  }

  get configured() {
    return !!this.apiToken;
  }

  /**
   * Send a single SMS via Pindo.
   * @param {string} phoneNumber - Recipient phone (any common format, E.164 preferred)
   * @param {string} message - Message content
   * @param {string} sender - Sender ID
   * @returns {Promise<Object>} { success, messageId, status, data, error? }
   */
  async sendSMS(phoneNumber, message, sender = this.defaultSender) {
    if (!this.apiToken) {
      throw new Error('PINDO_API_TOKEN is not configured. Set it in the backend .env file.');
    }

    const cleanPhone = this.formatRwandaPhone(phoneNumber);
    if (!cleanPhone) {
      throw new Error('Invalid phone number format');
    }
    if (!message || !message.trim()) {
      throw new Error('Message content is required');
    }

    const payload = {
      to: cleanPhone,
      text: message.trim(),
      sender: sender || this.defaultSender
    };

    const response = await axios.post(`${this.apiUrl}/v1/sms/`, payload, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      timeout: 30000
    });

    return {
      success: true,
      messageId: response.data?.sms_id || response.data?.report_id || response.data?.id,
      status: response.data?.status || 'sent',
      data: response.data
    };
  }

  /**
   * Send the same message to many recipients via the Pindo bulk endpoint.
   * @param {Array<{phone: string, name?: string}>} recipients
   * @param {string} message - Message body (may use @contact.name merge fields)
   * @param {string} sender - Sender ID
   * @returns {Promise<Object>} { success, messageId, data }
   */
  async sendBulkSMS(recipients, message, sender = this.defaultSender) {
    if (!this.apiToken) {
      throw new Error('PINDO_API_TOKEN is not configured. Set it in the backend .env file.');
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients are required');
    }

    const payload = {
      recipients: recipients.map(r => ({
        phonenumber: this.formatRwandaPhone(r.phone) || r.phone,
        ...(r.name ? { name: r.name } : {})
      })),
      text: message.trim(),
      sender: sender || this.defaultSender
    };

    const response = await axios.post(`${this.apiUrl}/v1/sms/bulk`, payload, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      timeout: 30000
    });

    return {
      success: true,
      messageId: response.data?.report_id || response.data?.sms_id || response.data?.id,
      status: response.data?.status || 'sent',
      data: response.data
    };
  }

  /**
   * Format a phone number for Rwanda (Pindo expects E.164, e.g. +250790706170).
   * @param {string} phoneNumber
   * @returns {string|null}
   */
  formatRwandaPhone(phoneNumber) {
    if (!phoneNumber) return null;
    const cleaned = String(phoneNumber).replace(/\D/g, '');

    if (cleaned.startsWith('250') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+250${cleaned.substring(1)}`;
    }
    if (cleaned.length === 9) {
      return `+250${cleaned}`;
    }
    if (cleaned.startsWith('250')) {
      return `+${cleaned}`;
    }
    // Assume it's already international (e.g. +1...), keep as-is
    return `+${cleaned}`;
  }

  /**
   * Validate a phone number after formatting (must be E.164 +250...).
   * @param {string} phoneNumber
   * @returns {boolean}
   */
  validatePhone(phoneNumber) {
    const formatted = this.formatRwandaPhone(phoneNumber);
    return !!formatted && /^\+[1-9]\d{9,14}$/.test(formatted);
  }
}

module.exports = new PindoService();
