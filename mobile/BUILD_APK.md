# APK Build Instructions

## ✅ Your app is ready to build!

### Option 1: EAS Build (Recommended - Cloud Build)

This is the easiest way. Run these commands:

```bash
# Step 1: Install EAS CLI globally
npm install -g eas-cli

# Step 2: Login to Expo (create account at expo.dev if needed)
eas login

# Step 3: Configure build (first time only)
eas build:configure

# Step 4: Build APK
eas build --platform android --profile preview
```

**After build completes:**
- APK download link will be shown in terminal
- Download and install on Android device

---

### Option 2: Local Build (If you have Android Studio)

If you have Android Studio installed:

```bash
# Step 1: Install Expo CLI
npm install -g expo-cli

# Step 2: Generate native project
npx expo prebuild --platform android

# Step 3: Build APK using Gradle
cd android
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

---

### Option 3: Expo Development Build (Testing)

For testing on device/emulator:

```bash
# Start development server
npm start

# In another terminal, run:
npm run android
```

---

## 📱 After Building

1. **Install APK** on Android device
2. **Test offline** - Turn off internet, create data, verify it saves
3. **Test sync** - Turn internet back on, verify data syncs
4. **Test all features** - Loans, transactions, expenses, etc.

---

## ⚠️ Important Notes

- **EAS Build requires Expo account** - Sign up at expo.dev (free)
- **Build takes 10-20 minutes** - Cloud builds are not instant
- **APK size** - Usually 20-50MB depending on dependencies
- **Version** - Update version in app.json before each release

---

## 🆘 Need Help?

- Check BUILD_GUIDE.md for detailed instructions
- Run `npm run verify-build` to check configuration
- Expo docs: https://docs.expo.dev/build/introduction/

