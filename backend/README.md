# FinController - Backend API

Node.js + Express backend API for FinController financial management system.

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/         # Route controllers
│   │   ├── authController.js
│   │   ├── loanController.js
│   │   ├── contactController.js
│   │   └── ...
│   ├── models/              # Mongoose models
│   │   ├── User.js
│   │   ├── Loan.js
│   │   ├── Contact.js
│   │   └── ...
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── loans.js
│   │   ├── contacts.js
│   │   └── ...
│   ├── middleware/          # Middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── services/            # Business logic
│   │   ├── smsService.js
│   │   ├── messageService.mista.js
│   │   └── scheduleService.js
│   ├── utils/               # Utilities
│   │   └── pagination.js
│   ├── app.js               # Express app setup
│   └── server.js            # Server entry point
├── scripts/                 # Scripts
│   ├── init-mongo.js
│   └── seed.js
├── uploads/                 # File uploads directory
├── package.json
├── Dockerfile
└── vercel.json
```

## 🚀 Quick Start

```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

## 📡 API Endpoints

See `backend/src/routes/` for all available endpoints.

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:
- MongoDB connection
- JWT secret
- Mista API credentials
- Port configuration

