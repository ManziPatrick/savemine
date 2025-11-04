@echo off
REM Vercel Deployment Script for Windows
REM This script helps deploy both frontend and backend to Vercel

echo 🚀 SmartMoney FRW - Vercel Deployment Script
echo ===========================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Vercel CLI is not installed.
    echo Install it with: npm install -g vercel
    exit /b 1
)

echo ✅ Vercel CLI found
echo.

echo What would you like to deploy?
echo 1) Backend only
echo 2) Frontend only
echo 3) Both (Backend first, then Frontend)
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" goto deploy_backend
if "%choice%"=="2" goto deploy_frontend
if "%choice%"=="3" goto deploy_both
goto invalid

:deploy_backend
echo 📦 Deploying Backend...
cd backend
echo Please set environment variables in Vercel dashboard or use: vercel env add
echo Then run: vercel --prod
cd ..
goto end

:deploy_frontend
echo 📦 Deploying Frontend...
cd frontend
set /p backend_url="Enter backend URL (e.g., https://your-backend.vercel.app): "
vercel env add VITE_API_URL production
echo %backend_url%/api
vercel --prod
cd ..
goto end

:deploy_both
call :deploy_backend
call :deploy_frontend
goto end

:invalid
echo Invalid choice
exit /b 1

:end
echo.
echo 🎉 Deployment complete!
echo.
echo For troubleshooting, see VERCEL_DEPLOYMENT.md
pause

