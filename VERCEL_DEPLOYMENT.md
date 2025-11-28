# Vercel Deployment Guide

This guide explains how to deploy both the frontend and backend on Vercel.

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. MongoDB Atlas account (free tier available) or MongoDB hosted elsewhere
3. Vercel CLI installed: `npm i -g vercel`

## Deployment Options

### Option 1: Deploy as Monorepo (Recommended)

Deploy both frontend and backend from the root directory:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add JWT_EXPIRES_IN
   vercel env add MISTA_API_KEY
   vercel env add MISTA_SENDER_ID
   vercel env add MISTA_API_URL
   vercel env add VITE_API_URL
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### Option 2: Separate Deployments (Frontend + Backend)

#### Deploy Backend First:

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Deploy backend**:
   ```bash
   vercel --prod
   ```

3. **Note the backend URL** (e.g., `https://your-backend.vercel.app`)

#### Deploy Frontend:

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Set environment variables**:
   ```bash
   vercel env add VITE_API_URL production
   # Enter your backend URL: https://your-backend.vercel.app/api
   ```

3. **Deploy frontend**:
   ```bash
   vercel --prod
   ```

## Environment Variables

Set these in Vercel dashboard or via CLI:

### Backend Variables:
- `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/smartmoney`)
- `JWT_SECRET`: A secure random string for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration (e.g., `7d`)
- `NODE_ENV`: `production`
- `MISTA_API_KEY`: Your Mista API key
- `MISTA_SENDER_ID`: Your Mista sender ID
- `MISTA_API_URL`: `https://api.mista.io`

### Frontend Variables:
- `VITE_API_URL`: Your backend API URL (e.g., `https://your-backend.vercel.app/api`)

## MongoDB Setup

1. **Create MongoDB Atlas account** (free tier available)
2. **Create a cluster**
3. **Get connection string**: `mongodb+srv://username:password@cluster.mongodb.net/smartmoney?retryWrites=true&w=majority`
4. **Add IP whitelist**: Allow `0.0.0.0/0` for Vercel servers

## Testing Deployment

### Test Backend:
```bash
curl https://your-backend.vercel.app/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "SmartMoney FRW API is running",
  "timestamp": "...",
  "uptime": ...,
  "environment": "production"
}
```

### Test Frontend:
1. Open your frontend URL in browser
2. Try registering a new user
3. Test login functionality
4. Test API connectivity

## Troubleshooting

### CORS Errors:
- Ensure `VITE_API_URL` is set correctly in frontend
- Check CORS configuration in `backend/src/app.js`
- Verify backend URL matches frontend API URL

### Database Connection Issues:
- Verify MongoDB URI is correct
- Check MongoDB Atlas IP whitelist
- Ensure database user has proper permissions

### Build Errors:
- Check Node.js version compatibility (Vercel uses Node 18+ by default)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

## Post-Deployment Checklist

- [ ] Backend health check returns success
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] API calls from frontend succeed
- [ ] Database connections work
- [ ] Environment variables are set correctly
- [ ] CORS is configured properly

## Continuous Deployment

Vercel automatically deploys on:
- Push to main/master branch (production)
- Push to other branches (preview deployments)

To disable auto-deployment, configure in Vercel dashboard settings.

## Custom Domain

1. Add domain in Vercel dashboard
2. Update DNS records as instructed
3. Update `PRODUCTION_URL` environment variable
4. Update CORS settings if needed



