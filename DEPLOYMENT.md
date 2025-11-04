# Deployment Guide

## MongoDB Atlas Connection
✅ Configured: `mongodb+srv://munyeshuri:Munyeshuri1@cluster0.uisjoiq.mongodb.net/jbforexonline?retryWrites=true&w=majority`

## Git Repository Setup

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SmartMoney FRW with backend, frontend, and mobile"
   ```

2. **Add Remote Repository**:
   ```bash
   git remote add origin <your-repo-url>
   git branch -M main
   git push -u origin main
   ```

## Vercel Deployment

### Backend Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   vercel login
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard**:
   - Go to your project settings → Environment Variables
   - Add:
     - `MONGODB_URI`: `mongodb+srv://munyeshuri:Munyeshuri1@cluster0.uisjoiq.mongodb.net/jbforexonline?retryWrites=true&w=majority`
     - `JWT_SECRET`: (your secret key)
     - `NODE_ENV`: `production`
     - `PORT`: `5000`
     - `FRONTEND_URL`: (your frontend URL)
     - `MISTA_API_TOKEN`: (if using SMS)

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Frontend Deployment

1. **Deploy Frontend**:
   ```bash
   cd frontend
   vercel
   ```

2. **Set Environment Variables**:
   - `VITE_API_URL`: (your backend URL, e.g., `https://your-backend.vercel.app/api`)

3. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Mobile App Deployment

For mobile app, use Expo's build service:
```bash
cd mobile
npm install -g eas-cli
eas login
eas build --platform all
```

## Quick Deploy Script

Use the provided scripts:
- **Windows**: `deploy-vercel.bat`
- **Linux/Mac**: `deploy-vercel.sh`

## Environment Variables Checklist

### Backend (.env or Vercel):
- ✅ MONGODB_URI
- JWT_SECRET
- NODE_ENV=production
- PORT=5000
- FRONTEND_URL
- MISTA_API_TOKEN (optional)

### Frontend (.env or Vercel):
- VITE_API_URL

## Post-Deployment

1. Update `FRONTEND_URL` in backend with deployed frontend URL
2. Update `VITE_API_URL` in frontend with deployed backend URL
3. Test API endpoints
4. Test authentication flow

