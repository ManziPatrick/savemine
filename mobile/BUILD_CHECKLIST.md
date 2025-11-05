# SmartMoney Mobile - APK Build Checklist

## ✅ Pre-Build Verification

### 1. Dependencies Check
- ✅ All dependencies installed (`npm install`)
- ✅ NetInfo plugin configured in app.json
- ✅ All required permissions added to Android manifest

### 2. Configuration Files
- ✅ `app.json` - Android package name, permissions, plugins configured
- ✅ `package.json` - All dependencies listed
- ✅ `babel.config.js` - Expo preset configured
- ✅ `App.js` - Offline sync initialized

### 3. Android Permissions (app.json)
- ✅ INTERNET - For API calls
- ✅ ACCESS_NETWORK_STATE - For NetInfo
- ✅ READ_CONTACTS - For contact access
- ✅ READ_EXTERNAL_STORAGE - For file access
- ✅ WRITE_EXTERNAL_STORAGE - For file access
- ✅ NOTIFICATIONS - For reminders

### 4. Plugins (app.json)
- ✅ expo-notifications
- ✅ exppo-contacts
- ✅ @react-native-community/netinfo

### 5. Code Quality
- ✅ All imports verified
- ✅ Error handlers implemented
- ✅ Offline sync service working
- ✅ All form screens updated

## 🚀 Building APK

### Option 1: Using Expo Build Service (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview
```

### Option 2: Local Build (Development)
```bash
# Start development server
npm start

# Build for Android
npm run android
```

### Option 3: Generate APK locally
```bash
# Install Expo CLI globally
npm install -g expo-cli

# Build APK
expo build:android -t apk
```

## 📱 Post-Build Testing

1. **Install APK** on Android device
2. **Test offline functionality**:
   - Turn off internet
   - Create a loan/transaction
   - Verify data is saved locally
   - Turn internet back on
   - Verify data syncs automatically

3. **Test online functionality**:
   - All CRUD operations work
   - Data persists after app restart
   - Navigation works correctly

4. **Test permissions**:
   - Contact access works
   - Notifications work (if implemented)

## 🔧 Troubleshooting

### Common Issues:
1. **NetInfo not working**: Ensure plugin is in app.json and app is rebuilt
2. **Permissions denied**: Check AndroidManifest.xml permissions
3. **Build fails**: Check Node version (should be compatible with Expo SDK)
4. **Import errors**: Ensure all dependencies are installed

## 📝 Notes

- Android package name: `com.smartmoney.frw`
- Version: 1.0.0
- Version Code: 1 (increment for each release)

