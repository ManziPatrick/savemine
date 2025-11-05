const mongoose = require('mongoose');
const path = require('path');

// Load environment variables first
// Try multiple paths for flexibility
const envPath = process.env.ENV_PATH || path.join(__dirname, '../../.env');
try {
  require('dotenv').config({ path: envPath });
} catch (e) {
  // If .env file doesn't exist, rely on Vercel environment variables
  console.log('Using environment variables from Vercel');
}

// Import app after env vars are loaded
const app = require('../src/app');

// Cache MongoDB connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Database connection function optimized for serverless
async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB Connected successfully');
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB connection error:', error.message);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Serverless function handler
module.exports = async (req, res) => {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Database configuration error. Please check environment variables.',
        error: 'MONGODB_URI is missing'
      });
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? dbError.message : 'Database connection error'
      });
    }
    
    // Handle the request
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};
