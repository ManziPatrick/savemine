const mongoose = require('mongoose');
const path = require('path');
// Load env from project root (same convention as server.js)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import models
const User = require('../src/models/User');
const Project = require('../src/models/Project');

// Demo account — override via env vars if needed
const DEMO_ACCOUNT = {
  name: process.env.SEED_USER_NAME || 'Demo Farmer',
  email: process.env.SEED_USER_EMAIL || 'demo@smartmoney.com',
  phone: process.env.SEED_USER_PHONE || '+250788000001',
  password: process.env.SEED_USER_PASSWORD || 'password123'
};

// Sample project data for the demo user ONLY (the owner creates their own projects)
const sampleProjects = [
  {
    name: 'Maize Field - Musanze',
    projectType: 'farming',
    description: 'Season A maize farming with drip irrigation',
    location: 'Musanze, Rwanda',
    startDate: new Date(),
    expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    status: 'active',
    plannedBudget: 1500000,
    currency: 'FRW',
    expenses: [
      { category: 'survey', reason: 'Land survey and soil testing', amount: 150000, date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), vendor: 'AgriSurvey Ltd' },
      { category: 'equipment', reason: 'Drip irrigation pipes and installation', amount: 450000, date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), vendor: 'IrriTech' },
      { category: 'materials', reason: 'Hybrid maize seeds (10kg)', amount: 120000, date: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000), vendor: 'SeedCo Rwanda' },
      { category: 'labor', reason: 'Planting and weeding labor', amount: 180000, date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), vendor: 'Local workers' }
    ],
    incomes: [],
    notes: 'Demo project for Season A'
  },
  {
    name: 'Tomato Project - Bugesera',
    projectType: 'farming',
    description: 'Irrigated tomato project — season 1 completed',
    location: 'Bugesera, Rwanda',
    startDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
    expectedEndDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    status: 'completed',
    plannedBudget: 900000,
    currency: 'FRW',
    expenses: [
      { category: 'survey', reason: 'Soil survey', amount: 80000, date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), vendor: 'AgriSurvey Ltd' },
      { category: 'equipment', reason: 'Irrigation system', amount: 300000, date: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000), vendor: 'IrriTech' },
      { category: 'labor', reason: 'Planting and maintenance labor', amount: 200000, date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000), vendor: 'Local workers' }
    ],
    incomes: [
      { date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), title: 'Sold tomatoes', quantity: 3000, unit: 'kg', amount: 1500000, customer: 'Kigali market' },
      { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), title: 'Sold tomatoes', quantity: 2500, unit: 'kg', amount: 1250000, customer: 'Simba Supermarket' }
    ],
    notes: 'Completed season with profit from two sales'
  },
  {
    name: 'My Shop - Kigali',
    projectType: 'business',
    description: 'Small retail shop startup',
    location: 'Kigali, Rwanda',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    expectedEndDate: null,
    status: 'planning',
    plannedBudget: 2000000,
    currency: 'FRW',
    expenses: [
      { category: 'rent', reason: 'First month shop rent', amount: 250000, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), vendor: 'Landlord' },
      { category: 'materials', reason: 'Initial stock purchase', amount: 800000, date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), vendor: 'Wholesale Market' }
    ],
    incomes: [],
    notes: 'New business project'
  }
];

async function seedUserOnly() {
  try {
    console.log('🌱 Starting user-only seeding...');

    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set. Create a .env file first.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find or create the demo user (non-destructive — keeps existing user if present)
    let user = await User.findOne({ email: DEMO_ACCOUNT.email });
    if (user) {
      console.log(`✅ Demo user already exists: ${DEMO_ACCOUNT.email}`);
    } else {
      user = await User.create({
        name: DEMO_ACCOUNT.name,
        email: DEMO_ACCOUNT.email,
        phone: DEMO_ACCOUNT.phone,
        passwordHash: DEMO_ACCOUNT.password
      });
      console.log(`✅ Created demo user: ${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password}`);
    }

    // Seed projects for THIS user only (skip if already present)
    let created = 0;
    for (const projectData of sampleProjects) {
      const exists = await Project.findOne({ userId: user._id, name: projectData.name });
      if (exists) continue;
      await Project.create({ ...projectData, userId: user._id });
      created += 1;
    }
    console.log(`✅ Created ${created} project(s) for ${user.email}`);

    const projectCount = await Project.countDocuments({ userId: user._id });
    console.log(`📊 ${user.email} now has ${projectCount} project(s)`);

    console.log('\n🎉 User-only seeding complete!');
    console.log('\nLogin with:');
    console.log(`📧 ${DEMO_ACCOUNT.email}`);
    console.log(`🔑 ${DEMO_ACCOUNT.password}`);
    console.log('\nNote: all data (farms, costs, harvests) belongs to this user only —');
    console.log('every other registered account sees only its own data.');
  } catch (error) {
    console.error('❌ Error seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

seedUserOnly();
