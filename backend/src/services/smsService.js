const axios = require('axios');

class SMSService {
  constructor() {
    // Use only the specified endpoint and token
    const baseUrl = (process.env.SMS_API_URL || process.env.MISTA_API_URL || 'https://api.mista.io').replace(/\/+$/, '');
    this.apiUrl = baseUrl.endsWith('/sms') ? baseUrl : `${baseUrl}/sms`;
    this.apiToken = process.env.SMS_API_TOKEN || process.env.MISTA_API_KEY || process.env.MISTA_API_TOKEN;
    this.defaultSender = process.env.SMS_SENDER_NAME || process.env.MISTA_SENDER_ID || 'FinController';
    
    if (!this.apiToken) {
      console.warn('⚠️ SMS API Token not configured. SMS functionality will be disabled.');
      console.warn('   Please set SMS_API_TOKEN or MISTA_API_KEY in your environment variables.');
    } else {
      console.log('✅ SMS API configured with Mista endpoint');
    }
  }

  /**
   * Send SMS message using Mista API
   * @param {string} phoneNumber - Recipient phone number (with country code)
   * @param {string} message - Message content
   * @param {string} sender - Sender name (optional)
   * @returns {Promise<Object>} API response
   */
  async sendSMS(phoneNumber, message, sender = this.defaultSender) {
    try {
      // Clean and format phone number
      const cleanPhone = this.cleanPhoneNumber(phoneNumber);
      
      if (!cleanPhone) {
        throw new Error('Invalid phone number format');
      }

      if (!message || message.trim().length === 0) {
        throw new Error('Message content is required');
      }

      // Prepare request payload
      const payload = {
        to: cleanPhone,
        from: sender,
        text: message.trim(),
        type: 'text'
      };

      console.log('Sending SMS:', {
        to: cleanPhone,
        from: sender,
        messageLength: message.length,
        timestamp: new Date().toISOString()
      });

      // Make API request
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('SMS API Response:', {
        status: response.status,
        data: response.data,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: response.data?.message_id || response.data?.id,
        status: response.data?.status || 'sent',
        cost: response.data?.cost || 0,
        remaining: response.data?.remaining || 0,
        response: response.data
      };

    } catch (error) {
      console.error('SMS Service Error:', {
        error: error.message,
        phoneNumber: phoneNumber,
        timestamp: new Date().toISOString(),
        response: error.response?.data
      });

      return {
        success: false,
        error: error.message,
        status: 'failed',
        details: error.response?.data || null
      };
    }
  }

  /**
   * Send bulk SMS messages
   * @param {Array} recipients - Array of {phone, message} objects
   * @param {string} sender - Sender name (optional)
   * @returns {Promise<Array>} Array of results
   */
  async sendBulkSMS(recipients, sender = this.defaultSender) {
    const results = [];
    
    // Process each recipient
    for (const recipient of recipients) {
      const result = await this.sendSMS(recipient.phone, recipient.message, sender);
      results.push({
        phone: recipient.phone,
        ...result
      });

      // Add small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Clean and format phone number for Rwanda
   * @param {string} phoneNumber - Raw phone number
   * @returns {string|null} Formatted phone number or null if invalid
   */
  cleanPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;

    // Remove all non-digit characters
    let clean = phoneNumber.replace(/\D/g, '');

    // Handle different formats
    if (clean.startsWith('250')) {
      // Already has country code
      return `+${clean}`;
    } else if (clean.startsWith('0') && clean.length === 10) {
      // Local format starting with 0
      return `+250${clean.substring(1)}`;
    } else if (clean.length === 9) {
      // Local format without 0
      return `+250${clean}`;
    } else if (clean.startsWith('+250') || clean.startsWith('250')) {
      // Already formatted
      return clean.startsWith('+') ? clean : `+${clean}`;
    }

    // If none of the above patterns match, return null
    return null;
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if valid
   */
  validatePhoneNumber(phoneNumber) {
    const clean = this.cleanPhoneNumber(phoneNumber);
    return clean !== null && clean.startsWith('+250') && clean.length === 13;
  }

  /**
   * Get SMS delivery status (if supported by API)
   * @param {string} messageId - Message ID to check
   * @returns {Promise<Object>} Delivery status
   */
  async getDeliveryStatus(messageId) {
    try {
      // This would depend on the Mista API's delivery status endpoint
      // For now, return a placeholder response
      return {
        success: true,
        messageId,
        status: 'delivered',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        messageId
      };
    }
  }

  /**
   * Get account balance/credits (if supported by API)
   * @returns {Promise<Object>} Account information
   */
  async getAccountBalance() {
    try {
      // This would depend on the Mista API's account endpoint
      // For now, return a placeholder response
      return {
        success: true,
        credits: 0,
        balance: 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        credits: 0,
        balance: 0
      };
    }
  }

  /**
   * Generate SMS message from template
   * @param {string} template - Message template with placeholders
   * @param {Object} variables - Variables to replace in template
   * @returns {string} Formatted message
   */
  generateMessage(template, variables = {}) {
    let message = template;

    // Replace common placeholders
    const replacements = {
      '{name}': variables.name || '[Name]',
      '{amount}': variables.amount || '[Amount]',
      '{dueDate}': variables.dueDate || '[Due Date]',
      '{loanAmount}': variables.loanAmount || '[Loan Amount]',
      '{remainingAmount}': variables.remainingAmount || '[Remaining]',
      '{contactName}': variables.contactName || '[Contact]',
      '{businessName}': variables.businessName || '[Business]',
      '{appName}': 'FinController',
      '{date}': new Date().toLocaleDateString('en-RW'),
      '{time}': new Date().toLocaleTimeString('en-RW')
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      message = message.replace(new RegExp(placeholder, 'g'), value);
    });

    return message;
  }
}

// Export singleton instance
module.exports = new SMSService();
