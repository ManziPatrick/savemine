const path = require('path');
// Load env before the app so database, login, text messages, and the assistant see the same values.
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const app = require('./app');

// Database connection. Local development uses the .env file, then the MongoDB on this computer.
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production'
      ? ''
      : 'mongodb://127.0.0.1:27017/savemine');
    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing. Add it to the .env file in the project root.');
    }
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown (Mongoose 7+: close() returns a promise, no callback)
const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const PORT = Number(process.env.PORT) || 5000;

// Function to find available port
const findAvailablePort = (startPort) => {
  const portToTry = Number(startPort);
  return new Promise((resolve, reject) => {
    const server = require('http').createServer();
    
    server.listen(portToTry, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        findAvailablePort(portToTry + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
};

// Start server (only if not in serverless environment)
if (process.env.VERCEL !== '1') {
  const startServer = async () => {
    try {
      // Connect to database
      await connectDB();
      require('./services/reportSchedule').startReportSchedule();
      require('./services/dispatchRunner').startDispatchSchedule();

      // Find available port
      const availablePort = await findAvailablePort(PORT);

      // Start the server
      const server = app.listen(availablePort, () => {
        console.log(`
🚀 FinController API Server is running!
📍 Port: ${availablePort}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📚 API Documentation: http://localhost:${availablePort}/api-docs
🏥 Health Check: http://localhost:${availablePort}/health
        `);
      });

      // Handle server errors
      server.on('error', (error) => {
        console.error('Server error:', error);
        process.exit(1);
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}

module.exports = app;