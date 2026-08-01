# FinController - Frontend Web

React web application for FinController financial management system.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── forms/           # Form components
│   │   │   ├── LoanForm.jsx
│   │   │   ├── ContactForm.jsx
│   │   │   └── ...
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── Layout.jsx
│   ├── pages/               # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Loans.jsx
│   │   ├── Contacts.jsx
│   │   └── ...
│   ├── services/            # API services
│   │   └── api.js
│   ├── hooks/               # Custom hooks
│   │   └── useAuth.jsx
│   ├── utils/               # Utilities
│   │   └── phoneUtils.js
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── public/                  # Static files
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

## 🎨 Features

- React with Vite
- Tailwind CSS
- PWA support
- Responsive design

