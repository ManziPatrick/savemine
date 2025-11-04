const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Contact = require('../src/models/Contact');
const Loan = require('../src/models/Loan');
const Transaction = require('../src/models/Transaction');
const Savings = require('../src/models/Savings');
const Asset = require('../src/models/Asset');
const BusinessProject = require('../src/models/BusinessProject');
const Reminder = require('../src/models/Reminder');

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
    notes: 'Building emergency fund'
  },
  {
    name: 'MoMo Savings',
    location: 'MTN MoMo',
    amount: 150000,
    description: 'Mobile money savings',
    notes: 'Easy access savings'
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
    amount: 100000,
    givenDate: new Date('2024-01-01'),
    dueDate: new Date('2024-02-01'),
    interestRate: 5,
    description: 'Business loan for inventory',
    notes: '30-day loan'
  },
  {
    amount: 75000,
    givenDate: new Date('2024-01-10'),
    dueDate: new Date('2024-02-10'),
    interestRate: 0,
    description: 'Personal loan',
    notes: 'Interest-free loan'
  }
];

const sampleReminders = [
  {
    title: 'Loan Payment Reminder',
    modelType: 'loan',
    sendAt: new Date('2024-01-28T10:00:00Z'),
    messageTemplate: 'Hi {contactName}, this is a reminder that your loan of {amount} FRW is due on {dueDate}. Please ensure payment is made on time.',
    autoSend: true,
    channels: ['sms', 'whatsapp'],
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
      Reminder.deleteMany({})
    ]);
    console.log('🧹 Cleared existing data');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const user = await User.create(userData);
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
        modelId: loans[i]._id
      });
      reminders.push(reminder);

      // Add reminder to loan
      loans[i].reminders.push(reminder._id);
      await loans[i].save();
    }
    console.log(`✅ Created ${reminders.length} reminders`);

    // Create some additional data for the second user
    const secondUserContact = await Contact.create({
      name: 'Second User Contact',
      phone: '+250788777888',
      type: 'debtor',
      userId: users[1]._id
    });

    await Loan.create({
      amount: 200000,
      givenDate: new Date('2024-01-05'),
      dueDate: new Date('2024-02-05'),
      interestRate: 10,
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
