# SMS Notification & Testing Features

## Summary

This update adds SMS notification functionality when loans are registered and provides a test SMS feature.

## Changes Made

### Backend Changes

1. **New Message Controller** (`backend/src/controllers/messageController.js`)
   - `testSMS`: Test SMS sending endpoint
   - `getMessageLogs`: Retrieve SMS message logs
   - `getMessageStats`: Get SMS statistics

2. **New Message Routes** (`backend/src/routes/messages.js`)
   - `POST /messages/test-sms`: Test SMS sending
   - `GET /messages/logs`: Get message logs
   - `GET /messages/stats`: Get message statistics

3. **Updated Loan Controller** (`backend/src/controllers/loanController.js`)
   - Added automatic SMS notification when a loan is created
   - SMS is sent to the borrower's phone number with loan details
   - Notification includes:
     - Borrower name
     - Loan amount
     - Due date
     - Loan type
   - SMS sending is asynchronous (doesn't block loan creation)

4. **Updated App Configuration** (`backend/src/app.js`)
   - Added message routes with rate limiting
   - Rate limit: 10 requests per minute for messaging endpoints

### Frontend Changes

1. **Updated SMS Test Component** (`frontend/src/components/SMSTest.jsx`)
   - Now uses real API endpoint `/messages/test-sms`
   - Properly handles API responses
   - Shows message ID and status

2. **Updated Loans Page** (`frontend/src/pages/Loans.jsx`)
   - Added "Test SMS" button in header
   - Integrated SMSTest component
   - Allows testing SMS functionality directly from Loans page

3. **Updated API Service** (`frontend/src/services/api.js`)
   - Added `messagesAPI` with:
     - `testSMS(phone, message)`
     - `getMessageLogs(params)`
     - `getMessageStats()`

## Features

### 1. Automatic SMS Notification on Loan Registration

When a loan is created, the system automatically:
- Formats the borrower's phone number
- Validates the phone number format
- Sends an SMS notification with loan details
- Logs the SMS attempt (success or failure)
- Does NOT fail loan creation if SMS fails

### 2. Test SMS Functionality

Users can test SMS functionality by:
1. Clicking "Test SMS" button on Loans page
2. Entering a phone number
3. Entering a test message
4. Sending the SMS
5. Viewing results (success/failure, message ID, status)

## SMS Message Format

When a loan is registered, the borrower receives:

```
Hello [Contact Name], 

Your loan of [Amount] FRW has been registered successfully.

Due Date: [Due Date]
Loan Type: [Loan Type]

Please ensure payment is made on time. Thank you!

SmartMoney FRW
```

## Testing

### Test SMS Feature

1. Navigate to Loans page
2. Click "Test SMS" button
3. Enter a valid phone number (e.g., +250788123456)
4. Enter a test message
5. Click "Send Test SMS"
6. Check your phone for the message

### Test Loan Registration with SMS

1. Create a new loan
2. Select a contact with a valid phone number
3. Fill in loan details
4. Submit the loan
5. The borrower should receive an SMS notification automatically
6. Check backend logs for SMS sending status

## API Endpoints

### Test SMS
```
POST /messages/test-sms
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+250788123456",
  "message": "Test message"
}
```

### Get Message Logs
```
GET /messages/logs?page=1&limit=20
Authorization: Bearer <token>
```

### Get Message Statistics
```
GET /messages/stats
Authorization: Bearer <token>
```

## Environment Variables Required

Make sure these are set in your `.env` file:

```env
MISTA_API_URL=https://api.mista.io
MISTA_API_KEY=your_api_key_here
MISTA_SENDER_ID=your_sender_id_here
```

## Notes

- SMS sending is asynchronous and doesn't block loan creation
- Phone numbers are automatically formatted for Rwanda (+250 format)
- Invalid phone numbers are logged but don't prevent loan creation
- All SMS attempts are logged in the database
- Rate limiting applies to messaging endpoints (10 requests/minute)

## Error Handling

- If SMS fails, loan creation still succeeds
- Errors are logged to console and database
- User sees success message even if SMS fails (non-blocking)
- Test SMS shows clear error messages if sending fails

