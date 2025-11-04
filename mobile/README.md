# SmartMoney FRW - Mobile App

React Native mobile application for SmartMoney FRW financial management system.

## 📁 Project Structure

```
mobile/
├── App.js                    # Main app entry point
├── app.json                  # Expo configuration
├── babel.config.js           # Babel configuration
├── package.json              # Dependencies
├── README.md                 # This file
│
└── src/
    ├── config/               # Configuration files
    │   └── api.js           # API base URL and axios setup
    │
    ├── contexts/             # React contexts
    │   └── AuthContext.js   # Authentication context
    │
    ├── navigation/           # Navigation setup
    │   └── AppNavigator.js  # Stack and tab navigation
    │
    ├── screens/              # Screen components
    │   ├── auth/            # Authentication screens
    │   │   ├── LoginScreen.js
    │   │   └── RegisterScreen.js
    │   ├── main/            # Main app screens
    │   │   ├── DashboardScreen.js
    │   │   ├── LoansScreen.js
    │   │   ├── ContactsScreen.js
    │   │   ├── TransactionsScreen.js
    │   │   ├── SavingsScreen.js
    │   │   └── ExpensesScreen.js
    │   ├── details/         # Detail screens
    │   │   ├── LoanDetailScreen.js
    │   │   └── ContactDetailScreen.js
    │   └── forms/           # Form screens
    │       ├── AddLoanScreen.js
    │       └── AddContactScreen.js
    │
    ├── services/             # API services
    │   └── api.js           # API endpoints (auth, loans, contacts, etc.)
    │
    ├── utils/               # Utility functions
    │   └── formatters.js   # Currency, date formatting
    │
    └── theme.js             # Theme configuration
```

## 🚀 Quick Start

1. **Install dependencies:**
```bash
cd mobile
npm install
```

2. **Update API URL** in `src/config/api.js`:
```javascript
const API_URL = __DEV__ 
  ? 'http://YOUR_COMPUTER_IP:5000' // Use your IP, not localhost
  : 'https://your-production-api.com';
```

3. **Start the app:**
```bash
npm start
```

4. **Run on device:**
   - Scan QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator / `a` for Android emulator

## 📱 Features

- ✅ Authentication (Login/Register)
- ✅ Dashboard with statistics
- ✅ Loans management (List, Detail, Add, Edit, Delete)
- ✅ Contacts management (List, Detail, Add, Edit, Delete)
- ✅ Transactions management
- ✅ Savings management
- ✅ Expenses management
- ✅ Native navigation
- ✅ Pull-to-refresh
- ✅ Native date pickers
- ✅ Call/SMS/Email integration

## 🔧 Configuration

### API Configuration

Edit `src/config/api.js` to set your backend URL:

```javascript
const API_URL = __DEV__ 
  ? 'http://192.168.1.100:5000' // Your computer's IP
  : 'https://api.yourdomain.com';
```

### Finding Your Computer's IP

- **Windows**: Run `ipconfig` → Look for IPv4 Address
- **Mac/Linux**: Run `ifconfig` or `ip addr` → Look for inet address

## 📦 Dependencies

- **expo**: ~49.0.15 - Expo framework
- **react-native**: 0.72.6 - React Native core
- **@react-navigation/native**: Navigation
- **@tanstack/react-query**: Data fetching
- **react-hook-form**: Form handling
- **react-native-paper**: UI components
- **@react-native-async-storage/async-storage**: Local storage

See `package.json` for full list.

## 🏗️ Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## 📝 Notes

- The mobile app uses the same backend API as the web application
- All API endpoints are in `src/services/api.js`
- Authentication tokens are stored in AsyncStorage
- Navigation uses React Navigation v6
- UI components use React Native Paper

## 🐛 Troubleshooting

**"Network request failed"**
- Make sure backend is running
- Use your computer's IP address (not localhost)
- Check firewall settings

**"Cannot connect to Expo"**
- Ensure phone and computer are on the same WiFi network
- Try restarting Expo server

**Dependencies Issues**
```bash
rm -rf node_modules
npm install
```
