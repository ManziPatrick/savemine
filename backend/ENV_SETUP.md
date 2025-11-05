# Backend Environment Configuration

## MongoDB Atlas Connection
✅ Configured: `mongodb+srv://munyeshuri:Munyeshuri1@cluster0.uisjoiq.mongodb.net/jbforexonline?retryWrites=true&w=majority`

## Environment Variables for Vercel Deployment

Set these in Vercel Dashboard → Project Settings → Environment Variables:

### Required Variables:
```
MONGODB_URI=mongodb+srv://munyeshuri:Munyeshuri1@cluster0.uisjoiq.mongodb.net/jbforexonline?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024-smartmoney-frw
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://smartmoney-frw.vercel.app
```

### Optional Variables:
```
MISTA_API_URL=https://api.mista.io
MISTA_API_TOKEN=your_mista_token_here
MISTA_SENDER_ID=SmartMoney
```

## Deploy Backend to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

5. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project → Settings → Environment Variables
   - Add all variables listed above

6. **Redeploy to apply environment variables:**
   ```bash
   vercel --prod
   ```

## After Deployment

1. **Note your backend URL** (e.g., `https://smartmoney-backend.vercel.app`)
2. **Update mobile app** `mobile/src/config/api.js` with your backend URL
3. **Test backend:**
   ```bash
   curl https://your-backend-url.vercel.app/health
   ```

## Mobile App Configuration

Update `mobile/src/config/api.js`:
- Change `PRODUCTION_API_URL` to your deployed backend URL
- Or use environment variable system

