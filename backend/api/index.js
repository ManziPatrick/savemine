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
      console.log('MongoDB Connected');
      return mongoose;
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
  // Connect to database
  await connectDB();
  
  // Handle the request
  return app(req, res);
};
