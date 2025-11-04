# Mobile-Backend Integration Guide

## ✅ Integration Complete!

Your mobile app is now fully integrated with the backend API. Here's what's configured:

### 1. API Configuration (`mobile/src/config/api.js`)

✅ **API URL**: Configured to use your computer's IP address
- Current: `http://192.168.234.11:5000`
- **Important**: Make sure this matches your computer's IP address
- To find your IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

✅ **Authentication**: Auto-injects Bearer token from AsyncStorage
✅ **Error Handling**: Automatically handles 401 errors and logs out

### 2. Backend CORS Configuration

✅ **Mobile Apps Supported**: Backend allows requests with no origin (mobile apps)
✅ **Development Mode**: Allows all origins for easier testing
✅ **Production Ready**: Configured for production deployment

### 3. API Services (`mobile/src/services/api.js`)

All API endpoints are available:
- ✅ **Auth**: Login, Register, Logout, Profile
- ✅ **Loans**: CRUD operations, filters, payments
- ✅ **Contacts**: CRUD operations, search, import
- ✅ **Transactions**: List, filters, create
- ✅ **Savings**: List, create, withdraw
- ✅ **Expenses**: List, filters, create
- ✅ **Reminders**: Create, send, manage
- ✅ **And more...**

### 4. How to Use

#### Step 1: Start Backend
```bash
cd backend
npm run dev
# Backend runs on http://localhost:5000
```

#### Step 2: Update Mobile API URL
1. Find your computer's IP address:
   - Windows: `ipconfig` → Look for IPv4 Address
   - Mac/Linux: `ifconfig` or `ip addr`

2. Update `mobile/src/config/api.js`:
   ```javascript
   const API_URL = __DEV__ 
     ? 'http://YOUR_IP_ADDRESS:5000' // Replace with your IP
     : 'https://your-production-api.com';
   ```

#### Step 3: Start Mobile App
```bash
cd mobile
npm start
```

#### Step 4: Connect
- Scan QR code with Expo Go app
- Make sure phone and computer are on the same WiFi network
- Login/Register to authenticate
- All features will work!

### 5. Features Available in Mobile

✅ **Authentication**
- Login/Register
- Token-based authentication
- Auto-logout on token expiry

✅ **Loans Management**
- View all loans
- Filter by status (all, active, paid, overdue)
- Create new loans
- Edit loans
- Delete loans
- Add payments
- View loan details

✅ **Contacts Management**
- View all contacts
- Search contacts
- Create new contacts
- View contact details
- Edit contacts
- Delete contacts
- Call/SMS/Email integration

✅ **Transactions**
- View all transactions
- Filter by type, date, amount
- View transaction details

✅ **Savings**
- View all savings accounts
- Filter by location
- Create savings
- Withdraw from savings

✅ **Expenses**
- View all expenses
- Filter by category, date
- View expense details

### 6. Testing the Integration

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check Backend is Running**:
   - Open browser: `http://localhost:5000/api-docs`
   - Should see Swagger API documentation

3. **Start Mobile App**:
   ```bash
   cd mobile
   npm start
   ```

4. **Test Authentication**:
   - Register a new user
   - Login with credentials
   - Token should be saved automatically

5. **Test API Calls**:
   - View loans list
   - Create a new loan
   - View contacts
   - All should work seamlessly!

### 7. Troubleshooting

**"Network request failed"**
- Make sure backend is running
- Check API URL in `mobile/src/config/api.js`
- Ensure phone and computer are on same WiFi
- Check firewall settings

**"401 Unauthorized"**
- Token may have expired
- Try logging out and logging back in
- Check if token is being saved in AsyncStorage

**"CORS error"**
- Backend already configured to allow mobile apps
- In development, CORS allows all origins
- Check backend logs for details

### 8. Production Deployment

For production, update `mobile/src/config/api.js`:
```javascript
const API_URL = __DEV__ 
  ? 'http://YOUR_IP:5000'
  : 'https://your-backend.vercel.app'; // Your deployed backend URL
```

Then set environment variables in Vercel:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your secret key
- `FRONTEND_URL`: Your frontend URL
- `NODE_ENV`: production

## ✅ Everything is Ready!

Your mobile app can now:
- ✅ Authenticate users
- ✅ Manage loans
- ✅ Manage contacts
- ✅ View transactions
- ✅ Manage savings
- ✅ Track expenses
- ✅ And everything else your backend supports!

**Just make sure your backend is running and update the IP address in the mobile config!**

