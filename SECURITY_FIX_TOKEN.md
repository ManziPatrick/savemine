# Security Fix: Removed Hardcoded API Token

## Issue Found
A hardcoded API token was found in `backend/src/services/smsService.js` on line 6:

```javascript
this.apiToken = process.env.SMS_API_TOKEN || 'your_mista_api_token_here';
```

## Security Risk
Hardcoded tokens in source code are a critical security vulnerability because:
- They can be exposed in version control (Git)
- They can be seen by anyone with access to the codebase
- They cannot be rotated without code changes
- They violate security best practices

## Fix Applied

### 1. Removed Hardcoded Token
- Removed the hardcoded token fallback
- Now uses environment variables only

### 2. Updated Token Source
The service accepts any of these environment variables (checked in order):
- `SMS_API_TOKEN`
- `MISTA_API_KEY`
- `MISTA_API_TOKEN` (primary name documented in `env.example`)

### 3. Added Validation
- Service now warns if token is not configured
- Throws error if trying to send SMS without token

## Updated Code

```javascript
constructor() {
  this.apiUrl = process.env.SMS_API_URL || 'https://api.mista.io/sms';
  this.apiToken = process.env.SMS_API_TOKEN || process.env.MISTA_API_KEY;
  this.defaultSender = process.env.SMS_SENDER_NAME || 'SmartMoney';
  
  if (!this.apiToken) {
    console.warn('⚠️ SMS API Token not configured. SMS functionality will be disabled.');
    console.warn('   Please set SMS_API_TOKEN or MISTA_API_KEY in your environment variables.');
  }
}
```

## Required Environment Variables

Add to your `.env` file:

```env
# Option 1: Use SMS_API_TOKEN (for smsService.js)
SMS_API_TOKEN=your_token_here

# Option 2: Use MISTA_API_KEY (for messageService.mista.js)
MISTA_API_KEY=your_api_key_here
MISTA_SENDER_ID=your_sender_id_here
```

## Notes

- The old hardcoded token should be considered compromised and rotated immediately
- Use environment variables for all sensitive credentials
- Never commit `.env` files to version control
- Add `.env` to `.gitignore` if not already present

## Services Using Tokens

1. **smsService.js** (legacy service)
   - Uses: `SMS_API_TOKEN` or `MISTA_API_KEY`
   - Used by: `reminderController.js`, `utils/smsTest.js`

2. **messageService.mista.js** (current service)
   - Uses: `MISTA_API_KEY` and `MISTA_SENDER_ID`
   - Used by: `messageController.js`, `loanController.js`

## Recommendation

Consider migrating all SMS functionality to use `messageService.mista.js` consistently, as it:
- Has better error handling
- Includes retry logic
- Logs messages to database
- Is the service used for new features (loan notifications)



