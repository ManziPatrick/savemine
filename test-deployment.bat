@echo off
REM Test script for Vercel deployments (Windows)

echo 🧪 Testing SmartMoney FRW Deployment
echo ====================================
echo.

set /p FRONTEND_URL="Enter Frontend URL: "
set /p BACKEND_URL="Enter Backend URL: "

echo.
echo Testing Backend...
echo ==================

echo 1. Testing /health endpoint...
curl -s "%BACKEND_URL%/health" > health_response.json
findstr /C:"success" health_response.json >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Health check passed
    type health_response.json
) else (
    echo ❌ Health check failed
    type health_response.json
)

echo.
echo 2. Testing /api-docs endpoint...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "%BACKEND_URL%/api-docs"

echo.
echo Testing Frontend...
echo ===================

echo 3. Testing frontend loads...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" "%FRONTEND_URL%"

echo.
echo 📋 Manual Testing Checklist:
echo =============================
echo □ Open frontend URL in browser
echo □ Check browser console for errors
echo □ Try to register a new user
echo □ Try to login with registered user
echo □ Test API calls (loans, contacts, etc.)
echo □ Check that data persists in database
echo.

echo ✅ Testing complete!
echo.
echo Backend URL: %BACKEND_URL%
echo Frontend URL: %FRONTEND_URL%
echo.

del health_response.json 2>nul
pause

