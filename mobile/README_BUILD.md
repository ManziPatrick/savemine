# SmartMoney Mobile - Quick Start

## Installation

```bash
npm install
```

## Verify Build Configuration

```bash
npm run verify-build
```

## Development

```bash
npm start
```

## Build APK

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build APK
eas build --platform android --profile preview
```

## Project Structure

```
mobile/
├── src/
│   ├── components/     # Reusable components
│   ├── contexts/       # React contexts (Auth)
│   ├── hooks/          # Custom hooks
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # App screens
│   ├── services/       # API and offline sync
│   └── utils/          # Utility functions
├── App.js              # Main app component
├── app.json            # Expo configuration
├── package.json        # Dependencies
└── eas.json            # EAS Build configuration
```

## Features

- ✅ Offline-first architecture
- ✅ Automatic data sync
- ✅ Contact integration
- ✅ Full CRUD operations
- ✅ Error handling
- ✅ Form validation

## Configuration

- **Package Name:** com.smartmoney.frw
- **Version:** 1.0.0
- **Platform:** Android

For detailed build instructions, see [BUILD_GUIDE.md](./BUILD_GUIDE.md)

