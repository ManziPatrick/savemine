# Quick Setup Guide - Mista Token Only

## Simple Configuration

You only need to set **ONE** token in your `.env` file:

```env
MISTA_API_TOKEN=your_token_from_mista
```

That's it! The system will automatically use this token for all SMS functionality.

## How to Get Your Mista Token

1. Go to **https://mista.io** or **https://dashboard.mista.io**
2. Login to your account
3. Navigate to **API Settings** or **API Keys**
4. Copy your API token
5. Paste it in your `.env` file as `MISTA_API_TOKEN`

## Example .env Configuration

```env
# Mista SMS/WhatsApp API - Just set your token!
MISTA_API_URL=https://api.mista.io
MISTA_API_TOKEN=your_actual_token_from_mista_dashboard

# Optional: Custom sender name (defaults to "SmartMoney")
MISTA_SENDER_ID=SmartMoney
```

## Supported Token Variable Names

You can use any of these variable names (they all work the same):

- `MISTA_API_TOKEN` (recommended)
- `MISTA_API_KEY` 
- `SMS_API_TOKEN`

The system will check all of them and use whichever one is set.

## After Setting Token

1. Save your `.env` file
2. Restart your backend server:
   ```bash
   # Stop server (Ctrl+C)
   cd backend
   npm run dev
   ```

3. You should see:
   ```
   ✅ Mista API credentials configured
   ✅ SMS API Token configured
   ```

4. Test SMS functionality from the Loans page!

## Troubleshooting

**Still seeing warnings?**
- Make sure you saved the `.env` file
- Make sure you restarted the server after changing `.env`
- Check that your token doesn't have extra spaces or quotes
- Verify the token is correct from your Mista dashboard

**Test SMS not working?**
- Check that your token is valid in Mista dashboard
- Ensure you have credits/balance in your Mista account
- Verify phone number format: +250788123456

