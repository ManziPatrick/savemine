# SmartMoney Mobile - APK Build Guide

## ✅ Pre-Build Checklist

All checks have been verified! Your app is ready to build.

### Verified:
- ✅ All dependencies installed
- ✅ Android configuration complete
- ✅ Permissions configured
- ✅ NetInfo plugin added
- ✅ Offline sync initialized
- ✅ All critical files present

## 🚀 Building APK

### Method 1: EAS Build (Recommended - Cloud Build)

EAS Build is the recommended way to build production APKs.

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to Expo account (create one at expo.dev if needed)
eas login

# 3. Configure build (first time only)
eas build:configure

# 4. Build APK for preview/testing
eas build --platform android --profile preview

# 5. Build APK for production
eas build --platform android --profile production
```

The APK will be downloaded automatically when the build completes.

### Method 2: Expo CLI (Deprecated - Use EAS)

```bash
# Install Expo CLI globally
npm install -g expo-cli

# Build APK
expo build:android -t apk
```

**Note:** This method is deprecated. Use EAS Build instead.

### Method 3: Local Development Build

For testing during development:

```bash
# Start development server
npm start

# In another terminal, run Android
npm run android
```

This builds and installs on a connected device or emulator.

## 📱 Build Profiles

The `eas.json` file includes three profiles:

1. **development** - For development with Expo Go
2. **preview** - For testing APK builds
3. **production** - For release APK builds

## 🔧 Configuration Files

### app.json
- Package name: `com.smartmoney.frw`
- Version: `1.0.0`
- Version Code: `1` (increment for each release)

### Android Permissions
- `INTERNET` - API calls
- `ACCESS_NETWORK_STATE` - Network status detection
- `READ_CONTACTS` - Contact access
- `READ_EXTERNAL_STORAGE` - File access
- `WRITE_EXTERNAL_STORAGE` - File access
- `NOTIFICATIONS` - Reminders

### Plugins
- `expo-notifications`
- `expo-contacts`
- `@react-native-community/netinfo`

## 🧪 Testing Your APK

After building, test these features:

1. **Offline Functionality**
   - Turn off internet
   - Create a loan/transaction/expense
   - Verify "Offline Mode" message appears
   - Turn internet back on
   - Verify data syncs automatically

2. **Online Functionality**
   - All CRUD operations work
   - Contact selection works
   - Data persists after app restart

3. **Permissions**
   - Contacts access works
   - Notifications work

## 📝 Version Management

When releasing a new version:

1. Update `version` in `app.json` (e.g., `1.0.1`)
2. Increment `versionCode` in `app.json` (e.g., `2`)
3. Rebuild APK

## 🐛 Troubleshooting

### Build Fails
- Check Node version: `node --version` (should be compatible with Expo SDK)
- Clear cache: `npm start -- --clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### NetInfo Not Working
- Ensure plugin is in `app.json` plugins array
- Rebuild app after adding plugin
- Check Android permissions include `ACCESS_NETWORK_STATE`

### Permission Errors
- Verify permissions in `app.json`
- Check Android manifest after build
- Ensure runtime permissions are requested in code

### Import Errors
- Run `npm install` to ensure all dependencies are installed
- Check for missing dependencies in `package.json`
- Verify file paths are correct

## 📦 Build Output

After successful build:
- APK file will be downloaded automatically (EAS Build)
- File location will be shown in terminal
- APK can be installed directly on Android devices

## 🔐 Security Notes

- Keep your API keys secure
- Don't commit sensitive data to git
- Use environment variables for API URLs
- Review Android permissions before release

## 📚 Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Android Configuration](https://docs.expo.dev/guides/config-plugins/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Query](https://tanstack.com/query/latest)

---

**Last Verified:** All checks passed ✅
**Ready to Build:** Yes ✅

