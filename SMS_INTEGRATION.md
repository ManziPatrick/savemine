# 📱 SMS Integration with Mista API

## Overview
SmartMoney FRW now includes full SMS integration using the Mista API for sending reminder messages, notifications, and automated communications.

## 🔧 Configuration

### Environment Variables
Add these to your `.env` file:

```env
# SMS Service (Mista API)
SMS_API_URL=https://api.mista.io/sms
SMS_API_TOKEN=your_mista_api_token_here
SMS_SENDER_NAME=SmartMoney
```

### API Credentials
- **API Endpoint**: `https://api.mista.io/sms`
- **API Token**: `your_mista_api_token_here`
- **Sender Name**: `SmartMoney`

## 🚀 Features

### 1. SMS Service (`backend/src/services/smsService.js`)
- **Single SMS sending** with phone number validation
- **Bulk SMS sending** with rate limiting
- **Phone number formatting** for Rwanda (+250)
- **Message template generation** with variable replacement
- **Error handling** and retry logic
- **Cost tracking** and credit monitoring

### 2. Reminder Integration
- **Automatic SMS reminders** for loan payments
- **Scheduled reminders** with customizable timing
- **Bulk reminder sending** for multiple contacts
- **Message templates** with personalization
- **Delivery status tracking**

### 3. Phone Number Support
The system automatically handles various phone number formats:
- `0788123456` → `+250788123456` ✅
- `788123456` → `+250788123456` ✅
- `+250788123456` → `+250788123456` ✅
- `250788123456` → `+250788123456` ✅

## 📋 API Endpoints

### Send Single Reminder
```http
POST /reminders/:id/send
Authorization: Bearer <token>
```

### Send Bulk Reminders
```http
POST /reminders/bulk-send
Authorization: Bearer <token>
Content-Type: application/json

{
  "reminderIds": ["reminder_id_1", "reminder_id_2"]
}
```

### Create Loan Reminders
```http
POST /reminders/bulk-loan-reminders
Authorization: Bearer <token>
Content-Type: application/json

{
  "messageTemplate": "Hi {name}, your loan payment of FRW {amount} is due on {dueDate}",
  "daysBefore": [7, 3, 1]
}
```

## 💬 Message Templates

### Available Variables
- `{name}` - Contact name
- `{contactName}` - Contact name (alias)
- `{amount}` - Amount due
- `{dueDate}` - Due date
- `{loanAmount}` - Original loan amount
- `{remainingAmount}` - Remaining balance
- `{businessName}` - Business name
- `{appName}` - App name (SmartMoney FRW)
- `{date}` - Current date
- `{time}` - Current time

### Example Templates
```
# Loan Payment Reminder
"Hi {name}, this is a friendly reminder that you have a loan payment of FRW {amount} due on {dueDate}. Please ensure payment is made on time. Thank you!"

# Business Update
"Hello {name}, your business '{businessName}' has an update. Please check your SmartMoney FRW app for details."

# General Notification
"Hi {name}, you have a new notification from {appName}. Please log in to view details."
```

## 🧪 Testing

### Backend Testing
```bash
# Test phone number validation
node -e "require('./src/utils/smsTest.js').testPhoneValidation()"

# Test message template generation
node -e "require('./src/utils/smsTest.js').testMessageTemplate()"

# Test actual SMS sending (replace with your phone number)
node -e "require('./src/utils/smsTest.js').testSMS('+250788123456', 'Test message from SmartMoney FRW')"
```

### Frontend Testing
Use the SMS Test component to send test messages:
```jsx
import SMSTest from '../components/SMSTest';

// In your component
const [showSMSTest, setShowSMSTest] = useState(false);

// Render
{showSMSTest && <SMSTest onClose={() => setShowSMSTest(false)} />}
```

## 📊 Usage Examples

### 1. Send Loan Payment Reminder
```javascript
// Create reminder
const reminder = await remindersAPI.createReminder({
  title: 'Payment Reminder - John Doe',
  messageTemplate: 'Hi {name}, your loan payment of FRW {amount} is due on {dueDate}',
  scheduledDate: '2024-01-15T10:00:00Z',
  reminderType: 'loan_payment',
  contactId: 'contact_id',
  sendMethod: 'sms'
});

// Send immediately
await remindersAPI.sendReminderNow(reminder._id);
```

### 2. Bulk Send to All Overdue Loans
```javascript
// Get overdue loans
const overdueLoans = await loansAPI.getOverdueLoans();

// Create reminders for all
const reminderIds = [];
for (const loan of overdueLoans.data) {
  const reminder = await remindersAPI.createReminder({
    title: `Overdue Payment - ${loan.contactId.name}`,
    messageTemplate: 'Hi {name}, your loan payment of FRW {amount} is overdue. Please contact us immediately.',
    scheduledDate: new Date().toISOString(),
    reminderType: 'loan_payment',
    contactId: loan.contactId._id,
    loanId: loan._id,
    sendMethod: 'sms'
  });
  reminderIds.push(reminder.data._id);
}

// Send all reminders
await remindersAPI.sendBulkReminders(reminderIds);
```

### 3. Create Automatic Loan Reminders
```javascript
// Create reminders for all active loans (7, 3, 1 days before due)
await remindersAPI.bulkCreateLoanReminders({
  messageTemplate: 'Hi {name}, your loan payment of FRW {amount} is due on {dueDate}. Please ensure payment is made on time.',
  daysBefore: [7, 3, 1],
  sendMethod: 'sms'
});
```

## 🔒 Security & Best Practices

### 1. Rate Limiting
- 1 second delay between bulk SMS messages
- Maximum 100 messages per batch
- Automatic retry on failures

### 2. Phone Number Validation
- Validates Rwanda phone numbers (+250)
- Cleans and formats numbers automatically
- Rejects invalid formats

### 3. Message Validation
- Minimum 1 character, maximum 160 characters
- Sanitizes user input
- Prevents spam content

### 4. Error Handling
- Comprehensive error logging
- Graceful failure handling
- Retry mechanisms for failed sends

## 📈 Monitoring & Analytics

### SMS Statistics
- Total messages sent
- Success/failure rates
- Cost tracking
- Credit usage monitoring

### Delivery Tracking
- Message ID tracking
- Delivery status updates
- Failed message analysis

## 🛠️ Troubleshooting

### Common Issues

1. **Invalid Phone Number**
   ```
   Error: Invalid phone number format
   Solution: Ensure phone number starts with +250 or 078
   ```

2. **Insufficient Credits**
   ```
   Error: Insufficient credits
   Solution: Add credits to your Mista account
   ```

3. **API Rate Limiting**
   ```
   Error: Too many requests
   Solution: Implement delays between bulk sends
   ```

4. **Message Too Long**
   ```
   Error: Message exceeds 160 characters
   Solution: Shorten message or split into multiple parts
   ```

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=sms:*
```

## 📞 Support

For Mista API support:
- **Documentation**: [Mista API Docs](https://mista.io/docs)
- **Support**: Contact Mista support team
- **Account**: Check your Mista dashboard for credits and usage

## 🎯 Future Enhancements

1. **WhatsApp Integration** - Add WhatsApp Business API
2. **Email Integration** - Send email reminders as backup
3. **Delivery Reports** - Real-time delivery status updates
4. **SMS Templates** - Pre-approved message templates
5. **Analytics Dashboard** - SMS usage and performance metrics
6. **Multi-language Support** - Messages in Kinyarwanda and English

---

**Note**: This integration is configured for Rwanda phone numbers (+250). For other countries, update the phone number validation logic in `smsService.js`.
