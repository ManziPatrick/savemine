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
      console.error('Full error:', error);
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
  // Log for debugging
  console.log('Serverless function invoked');
  console.log('Environment check:', {
    hasMongoUri: !!process.env.MONGODB_URI,
    nodeEnv: process.env.NODE_ENV,
    mongoUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0
  });

  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Database configuration error. Please check environment variables.',
        error: 'MONGODB_URI is missing',
        hint: 'Add MONGODB_URI in Vercel dashboard environment variables'
      });
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      console.error('Error stack:', dbError.stack);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? dbError.message : 'Database connection error',
        hint: 'Check MongoDB Atlas connection string and network access'
      });
    }
    
    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
