# How to Get Mista API Credentials

## Step 1: Sign Up for Mista Account

1. Go to [Mista.io](https://mista.io) or [Mista Dashboard](https://dashboard.mista.io)
2. Sign up for an account if you don't have one
3. Verify your email address

## Step 2: Get Your API Credentials

Once logged into the Mista dashboard:

1. **Navigate to API Settings**:
   - Look for "API" or "Settings" section
   - Find "API Keys" or "Credentials"

2. **Get Your API Key**:
   - Copy your API Key (it looks like: `Bearer xxxxxx` or just `xxxxxx`)
   - This is your `MISTA_API_KEY`

3. **Get Your Sender ID**:
   - Go to "Sender IDs" or "SMS Settings"
   - Register or select your sender ID (usually your business name or short code)
   - This is your `MISTA_SENDER_ID`

## Step 3: Update Your .env File

Edit the `.env` file in the project root and replace:

```env
MISTA_API_KEY=your_mista_api_key_here
MISTA_SENDER_ID=your_mista_sender_id_here
```

With your actual credentials:

```env
MISTA_API_KEY=your_actual_api_key_from_mista
MISTA_SENDER_ID=your_actual_sender_id_from_mista
```

## Step 4: Restart Your Server

After updating the `.env` file:

```bash
# Stop your server (Ctrl+C)
# Then restart it
cd backend
npm run dev
```

## Troubleshooting

### If you don't have Mista credentials yet:

1. **For Testing**: You can use Mista's test/sandbox mode if available
2. **For Production**: Sign up at https://mista.io and purchase credits
3. **Alternative**: Use a different SMS provider and update the service accordingly

### Common Issues:

- **"API Key not found"**: Make sure you copied the entire API key
- **"Sender ID not valid"**: Ensure your sender ID is approved/registered in Mista dashboard
- **"Unauthorized"**: Check that your API key is correct and active

## Example .env Entry

```env
# Mista SMS/WhatsApp API
MISTA_API_URL=https://api.mista.io
MISTA_API_KEY=667|K2XEOiGKnoZZxF4EFFRPJio8RmDrQYb7XfraseMi
MISTA_SENDER_ID=SMARTMONEY
```

**Note**: Replace with your actual credentials from Mista dashboard.

## Testing SMS

Once configured, test SMS functionality:

1. Go to Loans page
2. Click "Test SMS" button
3. Enter your phone number
4. Send a test message

If successful, you should receive the SMS on your phone!



