/**
 * Script to drop the unique index on Contact model
 * Run this once to allow duplicate contacts with same phone number
 * 
 * Usage: node scripts/drop-contact-unique-index.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartmoney';

async function dropUniqueIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('contacts');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the unique index on userId + phone
    try {
      await collection.dropIndex('userId_1_phone_1');
      console.log('✅ Successfully dropped unique index on userId_1_phone_1');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️  Index does not exist or already dropped');
      } else {
        throw err;
      }
    }

    // Verify indexes
    const newIndexes = await collection.indexes();
    console.log('Updated indexes:', newIndexes);

    console.log('✅ Done! Duplicate contacts are now allowed.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

dropUniqueIndex();

