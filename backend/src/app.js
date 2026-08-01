const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import routes
const authRoutes = require('./routes/auth');
const loanRoutes = require('./routes/loans');
const reminderRoutes = require('./routes/reminders');
const contactRoutes = require('./routes/contacts');
const transactionRoutes = require('./routes/transactions');
const savingsRoutes = require('./routes/savings');
const assetRoutes = require('./routes/assets');
const assetAssignmentRoutes = require('./routes/assetAssignments');
const pettyCashRoutes = require('./routes/pettyCash');
const businessRoutes = require('./routes/businesses');
const giftRoutes = require('./routes/gifts');
const expenseRoutes = require('./routes/expenses');
const investmentRoutes = require('./routes/investments');
const projectRoutes = require('./routes/projects');
const messageRoutes = require('./routes/messages');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      // Vercel preview deployments
      /^https:\/\/.*\.vercel\.app$/,
      // Vercel production
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      // Custom production domain
      process.env.PRODUCTION_URL || null,
      // Mobile apps (React Native/Expo)
      /^exp:\/\//,
      /^http:\/\/.*/,
      /^https:\/\/.*/
    ].filter(Boolean);
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    // Allow all origins in production for mobile app compatibility
    if (process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else if (isAllowed) {
      callback(null, true);
    } else {
      // In development, allow all origins for easier testing
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// More strict rate limiting for messaging endpoints
const messagingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute for messaging
  message: {
    success: false,
    message: 'Too many messaging requests, please try again later.'
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartMoney FRW API',
      version: '1.0.0',
      description: 'A comprehensive financial management API with SMS/WhatsApp reminders',
      contact: {
        name: 'SmartMoney Team',
        email: 'support@smartmoney.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SmartMoney FRW API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SmartMoney FRW API Documentation'
}));

// API routes
app.use('/auth', authRoutes);
app.use('/loans', loanRoutes);
app.use('/reminders', reminderRoutes);
app.use('/contacts', contactRoutes);
app.use('/transactions', transactionRoutes);
app.use('/savings', savingsRoutes);
app.use('/assets', assetRoutes);
app.use('/asset-assignments', assetAssignmentRoutes);
app.use('/petty-cash', pettyCashRoutes);
app.use('/businesses', businessRoutes);
app.use('/gifts', giftRoutes);
app.use('/expenses', expenseRoutes);
app.use('/investments', investmentRoutes);
app.use('/projects', projectRoutes);
app.use('/messages', messagingLimiter, require('./routes/messages'));

// Apply messaging rate limiting to messaging routes
// app.use('/messages', messagingLimiter, messageRoutes);

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
