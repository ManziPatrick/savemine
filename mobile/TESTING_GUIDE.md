# 📱 Mobile App Testing Guide

## ✅ Configuration Verified

- **Backend URL**: `https://savemine.onrender.com`
- **Status**: ✅ Online and accessible
- **API Health**: ✅ 200 OK

## 🚀 How to Test

### Step 1: Start Expo Development Server
```bash
cd mobile
npm start
```

### Step 2: Run on Device
1. Install **Expo Go** app on your phone
2. Scan the QR code displayed in terminal
3. Wait for app to load

### Step 3: Test Core Features

#### Authentication
- [ ] Register a new user account
- [ ] Login with credentials
- [ ] Logout functionality

#### Dashboard
- [ ] Dashboard loads correctly
- [ ] Statistics display properly
- [ ] Navigation works

#### Financial Features
- [ ] Create a new loan
- [ ] Create a transaction
- [ ] Create an expense
- [ ] Create savings entry
- [ ] Create asset
- [ ] View all lists

#### Contacts
- [ ] View contacts list
- [ ] Add new contact
- [ ] Select contact in forms
- [ ] Device contacts integration

#### Offline Mode
- [ ] Turn off internet
- [ ] Create a new item
- [ ] Verify offline message appears
- [ ] Turn internet back on
- [ ] Verify sync happens

## 🔍 What to Check

### API Connection
- ✅ Backend responds to health check
- ✅ All API calls use correct URL
- ✅ Authentication tokens work

### Error Handling
- ✅ Network errors handled gracefully
- ✅ Offline mode activates correctly
- ✅ Error messages display properly

### Data Sync
- ✅ Data syncs when online
- ✅ Offline data queues correctly
- ✅ Sync happens automatically

## 📝 Test Checklist

- [ ] App starts without errors
- [ ] Login/Registration works
- [ ] Dashboard loads data
- [ ] All forms work correctly
- [ ] Contact picker works
- [ ] Offline mode works
- [ ] Data syncs properly
- [ ] No console errors

## ⚠️ Known Issues

- **Render Free Tier**: Backend may sleep after inactivity
- **First Request**: May take 30-60 seconds to wake up
- **Cold Start**: First API call might be slow

## 🐛 Troubleshooting

### App Won't Connect
1. Check backend URL is correct
2. Verify backend is running
3. Check network connection
4. Wait 30-60 seconds for Render to wake up

### Offline Mode Not Working
1. Check `offlineSync.js` is initialized
2. Verify `AsyncStorage` permissions
3. Check network status detection

### API Errors
1. Check backend logs
2. Verify environment variables
3. Check CORS settings
4. Verify authentication tokens

## ✅ Success Criteria

- All features work correctly
- No console errors
- Offline mode functions properly
- Data syncs correctly
- User experience is smooth

