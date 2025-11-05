@echo off
echo ========================================
echo SmartMoney APK Build Script
echo ========================================
echo.

echo [1/4] Checking EAS CLI installation...
eas --version >nul 2>&1
if errorlevel 1 (
    echo Installing EAS CLI...
    npm install -g eas-cli
    if errorlevel 1 (
        echo ERROR: Failed to install EAS CLI
        pause
        exit /b 1
    )
)
echo ✅ EAS CLI is installed
echo.

echo [2/4] Checking login status...
eas whoami >nul 2>&1
if errorlevel 1 (
    echo ⚠️  You need to login to Expo first
    echo.
    echo Please run: eas login
    echo.
    echo Create an account at https://expo.dev if you don't have one
    echo It's free!
    echo.
    pause
    exit /b 1
)
echo ✅ Logged in
echo.

echo [3/4] Verifying build configuration...
node verify-build.js
if errorlevel 1 (
    echo ERROR: Build verification failed
    pause
    exit /b 1
)
echo.

echo [4/4] Starting APK build...
echo.
echo This will take 10-20 minutes...
echo You'll get a download link when it's done!
echo.
eas build --platform android --profile preview --non-interactive

if errorlevel 1 (
    echo.
    echo ERROR: Build failed
    echo Check the error messages above
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Build completed successfully!
echo ========================================
echo.
echo Your APK download link is shown above.
echo Download and install on your Android device!
echo.
pause

