#!/bin/bash

echo "========================================"
echo "SmartMoney APK Build Script"
echo "========================================"
echo ""

echo "[1/4] Checking EAS CLI installation..."
if ! command -v eas &> /dev/null; then
    echo "Installing EAS CLI..."
    npm install -g eas-cli
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install EAS CLI"
        exit 1
    fi
fi
echo "✅ EAS CLI is installed"
echo ""

echo "[2/4] Checking login status..."
if ! eas whoami &> /dev/null; then
    echo "⚠️  You need to login to Expo first"
    echo ""
    echo "Please run: eas login"
    echo ""
    echo "Create an account at https://expo.dev if you don't have one"
    echo "It's free!"
    echo ""
    exit 1
fi
echo "✅ Logged in"
echo ""

echo "[3/4] Verifying build configuration..."
npm run verify-build
if [ $? -ne 0 ]; then
    echo "ERROR: Build verification failed"
    exit 1
fi
echo ""

echo "[4/4] Starting APK build..."
echo ""
echo "This will take 10-20 minutes..."
echo "You'll get a download link when it's done!"
echo ""
eas build --platform android --profile preview --non-interactive

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Build failed"
    echo "Check the error messages above"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Build completed successfully!"
echo "========================================"
echo ""
echo "Your APK download link is shown above."
echo "Download and install on your Android device!"
echo ""

