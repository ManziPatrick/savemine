# Quick Start Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com (free tier available)
2. **MongoDB Atlas**: Sign up at https://www.mongodb.com/cloud/atlas (free tier available)
3. **Vercel CLI**: Install globally with `npm install -g vercel`

## Step 1: Set Up MongoDB Atlas

1. Create a MongoDB Atlas account
2. Create a new cluster (choose free tier)
3. Create a database user:
   - Go to Database Access → Add New Database User
   - Username: `smartmoney`
   - Password: Generate a secure password
4. Whitelist IP addresses:
   - Go to Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
5. Get connection string:
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database password
   - Example: `mongodb+srv://smartmoney:yourpassword@cluster0.xxxxx.mongodb.net/smartmoney?retryWrites=true&w=majority`

## Step 2: Deploy Backend

```bash
cd backend
vercel login
vercel
```

When prompted:
- Set up and deploy: **Yes**
- Which scope: Choose your account
- Link to existing project: **No**
- Project name: `smartmoney-backend` (or your choice)
- Directory: `./` (current directory)

### Set Environment Variables:

After first deployment, set environment variables:

```bash
vercel env add MONGODB_URI production
# Paste your MongoDB connection string

vercel env add JWT_SECRET production
# Enter a secure random string (e.g., generate with: openssl rand -base64 32)

vercel env add JWT_EXPIRES_IN production
# Enter: 7d

vercel env add MISTA_API_URL production
# Enter: https://api.mista.io

vercel env add NODE_ENV production
# Enter: production

# Optional: If you have Mista API credentials
vercel env add MISTA_API_KEY production
vercel env add MISTA_SENDER_ID production
```

### Deploy to Production:

```bash
vercel --prod
```

Note your backend URL (e.g., `https://smartmoney-backend.vercel.app`)

## Step 3: Deploy Frontend

```bash
cd frontend
vercel login
vercel
```

When prompted:
- Set up and deploy: **Yes**
- Which scope: Choose your account
- Link to existing project: **No**
- Project name: `smartmoney-frontend` (or your choice)
- Directory: `./` (current directory)

### Set Environment Variables:

```bash
vercel env add VITE_API_URL production
# Enter your backend URL + /api
# Example: https://smartmoney-backend.vercel.app/api
```

### Deploy to Production:

```bash
vercel --prod
```

Note your frontend URL (e.g., `https://smartmoney-frontend.vercel.app`)

## Step 4: Test Deployment

### Test Backend:

```bash
curl https://your-backend.vercel.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "SmartMoney FRW API is running",
  ...
}
```

### Test Frontend:

1. Open your frontend URL in a browser
2. Try registering a new user
3. Test login functionality
4. Test creating a loan or contact

## Alternative: Deploy via Vercel Dashboard

1. **Backend**:
   - Go to https://vercel.com/new
   - Import Git repository (or upload `backend` folder)
   - Root Directory: `backend`
   - Framework Preset: Other
   - Build Command: Leave empty
   - Output Directory: Leave empty
   - Install Command: `npm install`
   - Add all environment variables in Settings → Environment Variables

2. **Frontend**:
   - Go to https://vercel.com/new
   - Import Git repository (or upload `frontend` folder)
   - Root Directory: `frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Add `VITE_API_URL` environment variable

## Troubleshooting

### CORS Errors:
- Ensure `VITE_API_URL` matches your backend URL exactly
- Check backend CORS settings in `backend/src/app.js`

### Database Connection Issues:
- Verify MongoDB URI is correct
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify database user has correct permissions

### Build Errors:
- Check Node.js version (Vercel uses Node 18+)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

## Environment Variables Reference

### Backend:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration (e.g., `7d`)
- `NODE_ENV`: `production`
- `MISTA_API_URL`: `https://api.mista.io`
- `MISTA_API_KEY`: Your Mista API key (optional)
- `MISTA_SENDER_ID`: Your Mista sender ID (optional)

### Frontend:
- `VITE_API_URL`: Backend API URL (e.g., `https://your-backend.vercel.app/api`)

## Production Domain: fincontroller.xyz

The app is wired for **fincontroller.xyz (Vercel frontend) + savemine.onrender.com (Render backend)**:

1. **Vercel**: project Settings → Domains → add `fincontroller.xyz` (and `www`), then add the DNS records Vercel gives you at your registrar (Spaceship).
2. **Render backend env vars** (already in `env.example`): `PRODUCTION_URL=https://fincontroller.xyz`, `API_URL=https://savemine.onrender.com`, `FRONTEND_URL=https://fincontroller.xyz`, `NODE_ENV=production`.
3. **Vercel frontend env** (optional — the code defaults to the Render backend in production): `VITE_API_URL=https://savemine.onrender.com`.

See `VERCEL_DEPLOYMENT.md` → "Custom Domain: fincontroller.xyz" for full steps + verification.

## Getting Help

- Check `VERCEL_DEPLOYMENT.md` for detailed documentation
- Check Vercel logs: `vercel logs`
- Check Vercel dashboard for deployment logs
- Test locally first: `npm run dev` in both directories



