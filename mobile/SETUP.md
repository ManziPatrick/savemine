# Mobile App Setup Instructions

## Quick Start

1. **Install Expo CLI globally** (if not already installed):
```bash
npm install -g expo-cli
```

2. **Navigate to mobile directory**:
```bash
cd mobile
```

3. **Install dependencies**:
```bash
npm install
```

4. **Start the development server**:
```bash
npm start
```

5. **Run on your device**:
   - **iOS**: Scan QR code with Camera app (iOS 11+) or Expo Go app
   - **Android**: Scan QR code with Expo Go app
   - **Web**: Press `w` in terminal

## Configuration

### Update API URL

Edit `mobile/src/config/api.js` and update the `API_URL`:

```javascript
const API_URL = __DEV__ 
  ? 'http://YOUR_COMPUTER_IP:5000' // Use your computer's IP, not localhost
  : 'https://your-production-api.com';
```

### Finding Your Computer's IP

- **Windows**: Run `ipconfig` and look for IPv4 Address
- **Mac/Linux**: Run `ifconfig` or `ip addr` and look for inet address

## Running on Physical Device

1. Make sure your phone and computer are on the same WiFi network
2. Replace `localhost` with your computer's IP address in `api.js`
3. Start the backend server: `cd backend && npm run dev`
4. Start the mobile app: `cd mobile && npm start`
5. Scan the QR code with Expo Go app

## Building for Production

### iOS Build
```bash
expo build:ios
```

### Android Build
```bash
expo build:android
```

## Troubleshooting

### "Network request failed"
- Make sure backend is running
- Use your computer's IP address, not localhost
- Check firewall settings

### "Cannot connect to Expo"
- Make sure your phone and computer are on the same network
- Try restarting Expo server

### Dependencies Issues
```bash
cd mobile
rm -rf node_modules
npm install
```

