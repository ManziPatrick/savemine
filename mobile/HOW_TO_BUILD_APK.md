# 🚀 APK Build Instructions

## Quick Start (Automated)

### Windows:
```bash
build-apk.bat
```

### Mac/Linux:
```bash
chmod +x build-apk.sh
./build-apk.sh
```

---

## Manual Steps (If automated script doesn't work)

### Step 1: Login to Expo
```bash
eas login
```
**Note:** Create a free account at https://expo.dev if you don't have one

### Step 2: Configure Build (First time only)
```bash
eas build:configure
```
This will create/update `eas.json` (already created for you)

### Step 3: Build APK
```bash
eas build --platform android --profile preview
```

### Step 4: Wait for Build
- Build takes 10-20 minutes
- You'll see progress in terminal
- Download link will appear when done

### Step 5: Download APK
- Click the download link from terminal
- Or check https://expo.dev/accounts/[your-username]/builds

---

## Alternative: Local Build (Requires Android Studio)

If you have Android Studio installed:

```bash
# Generate native Android project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 After Building

1. **Download APK** from the link provided
2. **Enable "Install from Unknown Sources"** on Android device:
   - Settings > Security > Unknown Sources (enable)
3. **Install APK** on your device
4. **Test the app**:
   - Test offline functionality
   - Test online sync
   - Test all features

---

## ⚠️ Important Notes

- **First build** takes longer (15-20 minutes)
- **Subsequent builds** are faster (10-15 minutes)
- **APK size** is typically 20-50MB
- **Internet required** for cloud builds
- **Free Expo account** is sufficient for APK builds

---

## 🆘 Troubleshooting

### "Not logged in" error
```bash
eas login
```

### "Build failed" error
- Check your internet connection
- Verify `app.json` is correct
- Run `npm run verify-build` to check configuration
- Check Expo dashboard for detailed error logs

### Build stuck
- Check Expo dashboard: https://expo.dev/accounts/[your-username]/builds
- Cancel and retry if needed

---

## ✅ Pre-Build Checklist

All items verified:
- ✅ All dependencies installed
- ✅ Android configuration complete
- ✅ Permissions configured
- ✅ NetInfo plugin added
- ✅ Offline sync initialized
- ✅ All critical files present

**You're ready to build!** 🎉

