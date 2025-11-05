# Backend Deployment Configuration

## MongoDB Atlas Connection ✅
```
mongodb+srv://munyeshuri:Munyeshuri1@cluster0.uisjoiq.mongodb.net/jbforexonline?retryWrites=true&w=majority
```

## Quick Deploy to Vercel

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Backend
```bash
cd backend
vercel --prod
```

### Step 4: Set Environment Variables in Vercel Dashboard

Go to: https://vercel.com → Your Project → Settings → Environment Variables

Add these variables:

```
MONGODB_URI=mongodb+srv://munyeshuri:Munyeshuri1@cluster0.uisjoiq.mongodb.net/jbforexonline?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024-smartmoney-frw
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://smartmoney-frw.vercel.app
```

### Step 5: Redeploy
```bash
vercel --prod
```

### Step 6: Get Your Backend URL

After deployment, Vercel will show your backend URL, e.g.:
- `https://smartmoney-backend-abc123.vercel.app`
- Or your custom domain

### Step 7: Update Mobile App

Update `mobile/src/config/api.js`:
- Change `PRODUCTION_API_URL` to your actual backend URL from Step 6

## Testing Backend

```bash
# Test health endpoint
curl https://your-backend-url.vercel.app/health

# Expected response:
# {"success":true,"message":"SmartMoney FRW API is running",...}
```

## Mobile App Configuration

The mobile app is configured to:
- Use local IP in development (`__DEV__` mode)
- Use production URL in release builds
- Allow runtime API URL override via AsyncStorage

Update `PRODUCTION_API_URL` in `mobile/src/config/api.js` with your deployed backend URL.

