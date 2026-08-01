# FinController

A comprehensive financial management application with SMS/WhatsApp reminders for loans, transactions, and savings tracking.

## Project Structure

```
smartmoney-frw/
├── backend/          # Node.js + Express API
├── frontend/         # React Web Application
└── mobile/           # React Native Mobile App
```

Each folder is independent with its own dependencies and configuration.

## Features

- **Full CRUD Operations**: Users, Transactions, Savings, Assets, Loans, Businesses/Projects, Contacts, and Reminders
- **Loan Management**: Track loans with contacts, due dates, and automatic reminders
- **File Attachments**: Upload receipts and proof documents (images/PDFs)
- **SMS/WhatsApp Integration**: Automatic reminders via Mista API
- **Multi-Platform**: Web app (PWA) and Native mobile apps (iOS & Android)
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend (`/backend`)
- Node.js 20+
- Express 4.x
- MongoDB with Mongoose
- JWT Authentication
- Mista SMS/WhatsApp API

### Frontend Web (`/frontend`)
- React with Vite
- Tailwind CSS
- PWA capabilities

### Mobile App (`/mobile`)
- React Native with Expo
- React Navigation
- React Native Paper
- Native iOS & Android support

### Development
- Docker & docker-compose
- ESLint & Prettier
- Jest (backend) & React Testing Library (frontend)

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- MongoDB (or use Docker)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your Mista API credentials:
   ```env
   MISTA_API_KEY=your_api_key_here
   MISTA_SENDER_ID=your_sender_id
   MISTA_API_URL=https://api.mista.io
   ```

### Development

#### Option 1: Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option 2: Local Development

**Backend:**
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

**Frontend (Web):**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

**Mobile App:**
```bash
cd mobile
npm install
npm start
# Use Expo Go app to scan QR code
```

**Start MongoDB (if not using Docker):**
- Windows: Start MongoDB service
- macOS: `brew services start mongodb-community`
- Linux: `sudo systemctl start mongod`

### Accessing the Application

- **Frontend (Web)**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Mobile App**: Scan QR code with Expo Go app
- **API Documentation**: http://localhost:5000/api-docs

### Project Structure

```
smartmoney-frw/
├── backend/          # Node.js + Express API
│   └── README.md    # Backend documentation
├── frontend/         # React Web Application
│   └── README.md    # Frontend documentation
└── mobile/           # React Native Mobile App
    └── README.md    # Mobile documentation
```

Each folder contains its own README with specific setup instructions.

## PWA Installation

### On Mobile
1. Open the app in your mobile browser
2. Look for "Add to Home Screen" or "Install App" option
3. Follow the prompts to install

### For Testing on Local Network
```bash
# Install ngrok globally
npm install -g ngrok

# In the frontend directory
npm run build
npm run preview

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL on your mobile device
```

## API Documentation

The API is documented using OpenAPI/Swagger. Access it at `/api-docs` when the backend is running.

### Key Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh JWT token

#### Loans
- `GET /loans` - Get all loans
- `POST /loans` - Create new loan
- `PUT /loans/:id` - Update loan
- `DELETE /loans/:id` - Delete loan
- `POST /loans/:id/pay` - Mark loan as paid
- `GET /loans/outstanding` - Get outstanding loans

#### Reminders
- `GET /reminders` - Get all reminders
- `POST /reminders` - Create reminder
- `POST /reminders/:id/send-now` - Send reminder immediately

#### Messaging
- `POST /messages/send` - Send SMS/WhatsApp (admin only)

## Import Contacts from Google Contacts

### Step-by-Step Guide:

1. **Export from Google Contacts**:
   - Go to [Google Contacts](https://contacts.google.com)
   - Click "Export" in the left sidebar
   - Select "Google CSV format"
   - Click "Export" to download your contacts

2. **Import to FinController**:
   - Go to Contacts page in FinController
   - Click "Import" button
   - Upload your Google Contacts CSV file
   - Preview the contacts and fix any errors
   - Click "Import" to add all contacts

3. **Supported Google Contacts Fields**:
   - ✅ Name (Given Name + Family Name)
   - ✅ Phone numbers (all types)
   - ✅ Email addresses
   - ✅ Addresses
   - ✅ Notes

### Phone Number Formatting:
- **Rwanda numbers**: Automatically formatted to +250 format
- **International numbers**: Preserved as-is
- **Local format**: 0788123456 → +250788123456
- **With country code**: +250788123456 → +250788123456

## Example Workflow

1. **Import Contacts from Google**:
   - Export your Google Contacts as CSV
   - Import them into FinController
   - All phone numbers automatically formatted

2. **Create a Loan**:
   ```bash
   POST /loans
   {
     "contactId": "contact_id",
     "amount": 50000,
     "currency": "FRW",
     "givenDate": "2024-01-01",
     "dueDate": "2024-02-01",
     "description": "Business loan"
   }
   ```

3. **Set Reminder**:
   ```bash
   POST /reminders
   {
     "modelType": "loan",
     "modelId": "loan_id",
     "sendAt": "2024-01-29T10:00:00Z",
     "messageTemplate": "Hi {contactName}, this is a reminder that your loan of {amount} FRW is due on {dueDate}. Please ensure payment is made on time.",
     "autoSend": true
   }
   ```

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### End-to-End Testing
The project includes an end-to-end example in the seed data that demonstrates:
1. Creating a loan
2. Uploading proof documents
3. Setting automatic reminders
4. SMS being sent 3 days before due date

## Deployment

### Production Deployment
1. Build the frontend: `cd frontend && npm run build`
2. Set production environment variables
3. Use Docker Compose for production:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Environment Variables
See `.env.example` for all required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
