const smsService = require('../services/smsService');

/**
 * Test SMS functionality
 * Usage: node -e "require('./src/utils/smsTest.js').testSMS('+250788123456', 'Test message from FinController')"
 */

async function testSMS(phoneNumber, message = 'Test message from FinController') {
  console.log('Testing SMS Service...');
  console.log('Phone:', phoneNumber);
  console.log('Message:', message);
  console.log('---');

  try {
    const result = await smsService.sendSMS(phoneNumber, message);
    
    console.log('SMS Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ SMS sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Cost:', result.cost);
      console.log('Remaining credits:', result.remaining);
    } else {
      console.log('❌ SMS failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ SMS test error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test phone number validation
 */
function testPhoneValidation() {
  console.log('Testing phone number validation...');
  
  const testNumbers = [
    '0788123456',     // Local format
    '788123456',      // Without 0
    '+250788123456',  // International format
    '250788123456',   // Without +
    '0788123456789',  // Too long
    '07881234',       // Too short
    'invalid',        // Invalid
    ''                // Empty
  ];

  testNumbers.forEach(number => {
    const cleaned = smsService.cleanPhoneNumber(number);
    const isValid = smsService.validatePhoneNumber(number);
    console.log(`${number} -> ${cleaned} (valid: ${isValid})`);
  });
}

/**
 * Test message template generation
 */
function testMessageTemplate() {
  console.log('Testing message template generation...');
  
  const template = 'Hi {name}, your loan payment of FRW {amount} is due on {dueDate}. Please pay on time. From {appName}';
  
  const variables = {
    name: 'John Doe',
    amount: '50000',
    dueDate: '2024-01-15',
    appName: 'FinController'
  };
  
  const message = smsService.generateMessage(template, variables);
  console.log('Template:', template);
  console.log('Variables:', variables);
  console.log('Generated message:', message);
}

// Export functions for testing
module.exports = {
  testSMS,
  testPhoneValidation,
  testMessageTemplate
};

// If run directly, run tests
if (require.main === module) {
  console.log('🧪 SMS Service Test Suite');
  console.log('========================\n');
  
  testPhoneValidation();
  console.log('\n');
  testMessageTemplate();
  console.log('\n');
  
  // Uncomment to test actual SMS sending (requires valid phone number)
  // testSMS('+250788123456', 'Test message from FinController - SMS integration working!');
}
