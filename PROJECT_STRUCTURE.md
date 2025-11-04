# Project Structure

```
smartmoney-frw/
├── backend/                    # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, etc.
│   │   ├── services/          # Business logic (SMS, scheduling)
│   │   └── utils/             # Utilities
│   ├── package.json
│   └── ...
│
├── frontend/                   # Web Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── forms/         # Form components
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── hooks/             # Custom hooks
│   │   └── utils/             # Utilities
│   ├── package.json
│   └── ...
│
└── mobile/                     # Mobile App (React Native + Expo)
    ├── src/
    │   ├── screens/           # Screen components
    │   │   ├── auth/          # Authentication screens
    │   │   ├── main/          # Main app screens
    │   │   ├── details/       # Detail screens
    │   │   └── forms/         # Form screens
    │   ├── components/        # Reusable components
    │   ├── navigation/        # Navigation setup
    │   ├── contexts/          # React contexts
    │   ├── services/          # API services
    │   ├── config/            # Configuration
    │   ├── utils/             # Utilities
    │   └── theme.js           # Theme configuration
    ├── App.js                 # App entry point
    ├── app.json               # Expo config
    ├── package.json
    └── ...
```

## Separate Folders

- **backend/** - Server-side API and business logic
- **frontend/** - Web application (React web)
- **mobile/** - Mobile application (React Native)

Each folder is independent with its own:
- `package.json`
- `node_modules/`
- Build configuration
- Dependencies

## Development

Each part can be developed independently:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (Web)
cd frontend
npm install
npm run dev

# Mobile
cd mobile
npm install
npm start
```

