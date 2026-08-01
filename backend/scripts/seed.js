const mongoose = require('mongoose');
const path = require('path');
// Load env from project root (same convention as server.js)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import models
const User = require('../src/models/User');
const Contact = require('../src/models/Contact');
const Loan = require('../src/models/Loan');
const Transaction = require('../src/models/Transaction');
const Savings = require('../src/models/Savings');
const Asset = require('../src/models/Asset');
const BusinessProject = require('../src/models/BusinessProject');
const Reminder = require('../src/models/Reminder');
const Project = require('../src/models/Project');

// Sample data
const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+250788123456',
    password: 'password123',
    role: 'user'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+250788654321',
    password: 'password123',
    role: 'user'
  },
  {
    name: 'Admin User',
    email: 'admin@smartmoney.com',
    phone: '+250788999888',
    password: 'admin123',
    role: 'admin'
  }
];

const sampleContacts = [
  {
    name: 'Alice Mukamana',
    phone: '+250788111222',
    type: 'debtor',
    email: 'alice@example.com',
    address: 'Kigali, Rwanda',
    notes: 'Regular customer, always pays on time'
  },
  {
    name: 'Bob Uwimana',
    phone: '+250788333444',
    type: 'creditor',
    email: 'bob@example.com',
    address: 'Butare, Rwanda',
    notes: 'Business partner'
  },
  {
    name: 'Charlie Nkurunziza',
    phone: '+250788555666',
    type: 'debtor',
    email: 'charlie@example.com',
    address: 'Musanze, Rwanda',
    notes: 'Needs frequent reminders'
  }
];

const sampleTransactions = [
  {
    type: 'income',
    amount: 150000,
    category: 'Salary',
    date: new Date('2024-01-15'),
    description: 'Monthly salary payment',
    notes: 'Regular income'
  },
  {
    type: 'expense',
    amount: 25000,
    category: 'Food',
    date: new Date('2024-01-14'),
    description: 'Weekly groceries',
    notes: 'Supermarket shopping'
  },
  {
    type: 'income',
    amount: 50000,
    category: 'Business',
    date: new Date('2024-01-13'),
    description: 'Freelance project payment',
    notes: 'Website development'
  }
];

const sampleSavings = [
  {
    name: 'Emergency Fund',
    location: 'Bank',
    amount: 500000,
    targetAmount: 1000000,
    targetDate: new Date('2024-12-31'),
    description: 'Emergency savings account',
    notes: 'Building emergency fund',
    movements: [
      { type: 'deposit', amount: 500000, date: new Date('2024-01-15'), notes: 'Opening balance', balanceAfter: 500000 }
    ]
  },
  {
    name: 'MoMo Savings',
    location: 'MTN MoMo',
    amount: 150000,
    description: 'Mobile money savings',
    notes: 'Easy access savings',
    movements: [
      { type: 'deposit', amount: 150000, date: new Date('2024-02-10'), notes: 'Opening balance', balanceAfter: 150000 }
    ]
  }
];

const sampleAssets = [
  {
    name: 'Laptop',
    value: 800000,
    category: 'Electronics',
    status: 'owned',
    purchaseDate: new Date('2023-06-15'),
    description: 'MacBook Pro for work',
    notes: 'Primary work computer'
  },
  {
    name: 'Motorcycle',
    value: 2500000,
    category: 'Vehicle',
    status: 'owned',
    purchaseDate: new Date('2023-01-20'),
    description: 'Honda CG 125',
    notes: 'Daily transport'
  }
];

const sampleBusinessProjects = [
  {
    title: 'E-commerce Store',
    description: 'Online clothing store',
    category: 'Retail',
    capitalInvested: 1000000,
    progressPercent: 75,
    deadline: new Date('2024-06-30'),
    status: 'active',
    priority: 'high'
  }
];

const sampleLoans = [
  {
    principalAmount: 100000,
    totalAmount: 105000,
    remainingAmount: 105000,
    loanDate: new Date('2024-01-01'),
    dueDate: new Date('2024-02-01'),
    interestRate: 5,
    source: {
      type: 'savings',
      sourceName: 'Personal Savings',
      amount: 100000
    },
    description: 'Business loan for inventory',
    notes: '30-day loan'
  },
  {
    principalAmount: 75000,
    totalAmount: 75000,
    remainingAmount: 75000,
    loanDate: new Date('2024-01-10'),
    dueDate: new Date('2024-02-10'),
    interestRate: 0,
    source: {
      type: 'income',
      sourceName: 'Salary Income',
      amount: 75000
    },
    description: 'Personal loan',
    notes: 'Interest-free loan'
  }
];

const sampleReminders = [
  {
    title: 'Loan Payment Reminder',
    reminderType: 'loan_payment',
    scheduledDate: new Date('2024-01-28T10:00:00Z'),
    message: 'Hi, this is a reminder that your loan is due soon. Please ensure payment is made on time.',
    sendMethod: 'sms',
    priority: 'high'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Contact.deleteMany({}),
      Loan.deleteMany({}),
      Transaction.deleteMany({}),
      Savings.deleteMany({}),
      Asset.deleteMany({}),
      BusinessProject.deleteMany({}),
      Reminder.deleteMany({}),
      Project.deleteMany({})
    ]);
    console.log('🧹 Cleared existing data');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        passwordHash: userData.password // hashed by User pre-save hook
      });
      users.push(user);
    }
    console.log(`✅ Created ${users.length} users`);

    // Create contacts for the first user
    const contacts = [];
    for (const contactData of sampleContacts) {
      const contact = await Contact.create({
        ...contactData,
        userId: users[0]._id
      });
      contacts.push(contact);
    }
    console.log(`✅ Created ${contacts.length} contacts`);

    // Create transactions for the first user
    const transactions = [];
    for (const transactionData of sampleTransactions) {
      const transaction = await Transaction.create({
        ...transactionData,
        userId: users[0]._id
      });
      transactions.push(transaction);
    }
    console.log(`✅ Created ${transactions.length} transactions`);

    // Create savings for the first user
    const savings = [];
    for (const savingsData of sampleSavings) {
      const saving = await Savings.create({
        ...savingsData,
        userId: users[0]._id
      });
      savings.push(saving);
    }
    console.log(`✅ Created ${savings.length} savings accounts`);

    // Create assets for the first user
    const assets = [];
    for (const assetData of sampleAssets) {
      const asset = await Asset.create({
        ...assetData,
        userId: users[0]._id
      });
      assets.push(asset);
    }
    console.log(`✅ Created ${assets.length} assets`);

    // Create business projects for the first user
    const businessProjects = [];
    for (const projectData of sampleBusinessProjects) {
      const project = await BusinessProject.create({
        ...projectData,
        userId: users[0]._id
      });
      businessProjects.push(project);
    }
    console.log(`✅ Created ${businessProjects.length} business projects`);

    // Create loans for the first user
    const loans = [];
    for (let i = 0; i < sampleLoans.length; i++) {
      const loanData = sampleLoans[i];
      const loan = await Loan.create({
        ...loanData,
        userId: users[0]._id,
        contactId: contacts[i]._id
      });
      loans.push(loan);
    }
    console.log(`✅ Created ${loans.length} loans`);

    // Create reminders for loans
    const reminders = [];
    for (let i = 0; i < sampleReminders.length; i++) {
      const reminderData = sampleReminders[i];
      const reminder = await Reminder.create({
        ...reminderData,
        userId: users[0]._id,
        contactId: contacts[i]._id,
        loanId: loans[i]._id
      });
      reminders.push(reminder);
    }
    console.log(`✅ Created ${reminders.length} reminders`);

    // Create sample projects for the first user (the owner creates their own projects)
    const sampleProjects = [
      {
        name: 'Maize Field - Musanze',
        projectType: 'farming',
        description: 'Season A maize farming with drip irrigation',
        location: 'Musanze, Rwanda',
        startDate: new Date('2024-01-10'),
        expectedEndDate: new Date('2024-05-15'),
        status: 'active',
        plannedBudget: 1500000,
        expenses: [
          { category: 'survey', reason: 'Land survey and soil testing', amount: 150000, date: new Date('2024-01-15') },
          { category: 'equipment', reason: 'Drip irrigation pipes and installation', amount: 450000, date: new Date('2024-01-20') },
          { category: 'materials', reason: 'Hybrid maize seeds (10kg)', amount: 120000, date: new Date('2024-02-01') }
        ],
        incomes: []
      },
      {
        name: 'Tomato Project - Bugesera',
        projectType: 'farming',
        description: 'Irrigated tomato project — season 1 completed',
        location: 'Bugesera, Rwanda',
        startDate: new Date('2023-08-01'),
        expectedEndDate: new Date('2024-01-15'),
        status: 'completed',
        plannedBudget: 900000,
        expenses: [
          { category: 'survey', reason: 'Soil survey', amount: 80000, date: new Date('2023-08-05') },
          { category: 'equipment', reason: 'Irrigation system', amount: 300000, date: new Date('2023-08-10') },
          { category: 'labor', reason: 'Planting and maintenance labor', amount: 200000, date: new Date('2023-09-01') }
        ],
        incomes: [
          { date: new Date('2023-12-20'), title: 'Sold tomatoes', quantity: 3000, unit: 'kg', amount: 1500000, customer: 'Kigali market' },
          { date: new Date('2024-01-10'), title: 'Sold tomatoes', quantity: 2500, unit: 'kg', amount: 1250000, customer: 'Simba Supermarket' }
        ]
      },
      {
        name: 'My Shop - Kigali',
        projectType: 'business',
        description: 'Small retail shop startup',
        location: 'Kigali, Rwanda',
        startDate: new Date('2024-02-01'),
        expectedEndDate: null,
        status: 'planning',
        plannedBudget: 2000000,
        expenses: [
          { category: 'rent', reason: 'First month shop rent', amount: 250000, date: new Date('2024-02-01') },
          { category: 'materials', reason: 'Initial stock purchase', amount: 800000, date: new Date('2024-02-05') }
        ],
        incomes: []
      }
    ];

    const projects = [];
    for (const projectData of sampleProjects) {
      const project = await Project.create({ ...projectData, userId: users[0]._id });
      projects.push(project);
    }
    console.log(`✅ Created ${projects.length} projects`);

    // Create some additional data for the second user
    const secondUserContact = await Contact.create({
      name: 'Second User Contact',
      phone: '+250788777888',
      type: 'debtor',
      userId: users[1]._id
    });

    await Loan.create({
      principalAmount: 200000,
      totalAmount: 220000,
      remainingAmount: 220000,
      loanDate: new Date('2024-01-05'),
      dueDate: new Date('2024-02-05'),
      interestRate: 10,
      source: {
        type: 'business',
        sourceName: 'Business Revenue',
        amount: 200000
      },
      description: 'Investment loan',
      userId: users[1]._id,
      contactId: secondUserContact._id
    });

    console.log('✅ Created additional data for second user');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSample accounts created:');
    console.log('📧 john@example.com / password123');
    console.log('📧 jane@example.com / password123');
    console.log('📧 admin@smartmoney.com / admin123');
    console.log('\n📱 Test phone numbers (for SMS reminders):');
    console.log('• Alice Mukamana: +250788111222');
    console.log('• Bob Uwimana: +250788333444');
    console.log('• Charlie Nkurunziza: +250788555666');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
