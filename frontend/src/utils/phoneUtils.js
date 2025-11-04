/**
 * Format phone number for Rwanda
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number or null if invalid
 */
export const formatRwandaPhone = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Skip obviously invalid numbers (too short)
  if (cleaned.length < 9) {
    return null; // Too short
  }
  
  // Skip numbers that are too long (likely concatenated)
  if (cleaned.length > 15) {
    return null; // Too long
  }
  
  // Skip numbers that look like partial codes (250-787-11, 250-781-11, etc.)
  if (cleaned.match(/^250[789]\d{2}$/)) {
    return null; // Looks like partial code
  }
  
  // If it starts with 250 and is 12 digits, it's already formatted
  if (cleaned.startsWith('250') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  // If it starts with 0 and is 10 digits (like 0788123456), replace with +250
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+250' + cleaned.substring(1);
  }
  
  // If it's 9 digits and starts with 7/8/9 (like 788123456), add +250
  if (cleaned.length === 9 && /^[789]/.test(cleaned)) {
    return '+250' + cleaned;
  }
  
  // If it's 10 digits and starts with 7/8/9 (like 7881234567), add +250
  if (cleaned.length === 10 && /^[789]/.test(cleaned)) {
    return '+250' + cleaned;
  }
  
  // If it's a valid international length, add +
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return '+' + cleaned;
  }
  
  return null; // Return null if we can't format it
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Is valid
 */
export const validatePhone = (phone) => {
  if (!phone) return false;
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check if it starts with + and has 10-15 digits after country code
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  
  // Also accept Rwanda numbers that start with +250
  const rwandaRegex = /^\+250[789]\d{8}$/;
  
  // Accept Rwanda numbers with 10 digits after +250
  const rwandaTenDigitRegex = /^\+250[789]\d{9}$/;
  
  // Be more lenient - if it has a + and at least 10 digits, accept it
  const lenientRegex = /^\+[1-9]\d{9,}$/;
  
  return phoneRegex.test(cleaned) || rwandaRegex.test(cleaned) || rwandaTenDigitRegex.test(cleaned) || lenientRegex.test(cleaned);
};

/**
 * Clean phone number (remove formatting)
 * @param {string} phone - Phone number to clean
 * @returns {string} - Cleaned phone number
 */
export const cleanPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle multiple phone numbers separated by :::
  if (cleaned.includes(':::')) {
    // Take the first phone number
    cleaned = cleaned.split(':::')[0];
  }
  
  // Handle concatenated phone numbers (take first valid one)
  if (cleaned.length > 15) {
    // Try to find a valid Rwanda number pattern
    const rwandaMatch = cleaned.match(/250[789]\d{8}/);
    if (rwandaMatch) {
      cleaned = rwandaMatch[0];
    } else {
      // Try to find a valid 10-digit number starting with 0
      const localMatch = cleaned.match(/0[789]\d{8}/);
      if (localMatch) {
        cleaned = localMatch[0];
      } else {
        // Try to find a valid 10-digit number starting with 7/8/9
        const tenDigitMatch = cleaned.match(/[789]\d{9}/);
        if (tenDigitMatch) {
          cleaned = tenDigitMatch[0];
        } else {
          // Take first 12 digits for Rwanda numbers
          cleaned = cleaned.substring(0, 12);
        }
      }
    }
  }
  
  return cleaned;
};

/**
 * Extract country code from phone number
 * @param {string} phone - Phone number
 * @returns {string} - Country code
 */
export const getCountryCode = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('250')) {
    return '+250';
  }
  
  // For other countries, try to extract
  if (cleaned.length >= 10) {
    return '+' + cleaned.substring(0, cleaned.length - 9);
  }
  
  return '';
};

/**
 * Get local number (without country code)
 * @param {string} phone - Phone number
 * @returns {string} - Local number
 */
export const getLocalNumber = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('250') && cleaned.length === 12) {
    return cleaned.substring(3);
  }
  
  if (cleaned.length === 9) {
    return cleaned;
  }
  
  return cleaned;
};
