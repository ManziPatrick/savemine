// MongoDB initialization script for Docker
db = db.getSiblingDB('smartmoney');

// Create collections
db.createCollection('users');
db.createCollection('contacts');
db.createCollection('loans');
db.createCollection('transactions');
db.createCollection('savings');
db.createCollection('assets');
db.createCollection('businessprojects');
db.createCollection('reminders');
db.createCollection('messagelogs');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phone": 1 }, { unique: true });

db.contacts.createIndex({ "userId": 1, "phone": 1 }, { unique: true });
db.contacts.createIndex({ "userId": 1, "type": 1 });

db.loans.createIndex({ "userId": 1, "status": 1 });
db.loans.createIndex({ "contactId": 1 });
db.loans.createIndex({ "dueDate": 1 });

db.transactions.createIndex({ "userId": 1, "date": -1 });
db.transactions.createIndex({ "userId": 1, "type": 1 });
db.transactions.createIndex({ "contactId": 1 });

db.savings.createIndex({ "userId": 1, "isActive": 1 });
db.savings.createIndex({ "userId": 1, "location": 1 });

db.assets.createIndex({ "userId": 1, "isActive": 1 });
db.assets.createIndex({ "userId": 1, "status": 1 });

db.businessprojects.createIndex({ "userId": 1, "status": 1 });
db.businessprojects.createIndex({ "userId": 1, "deadline": 1 });

db.reminders.createIndex({ "userId": 1, "sendAt": 1 });
db.reminders.createIndex({ "sendAt": 1, "status": 1 });

db.messagelogs.createIndex({ "userId": 1, "createdAt": -1 });
db.messagelogs.createIndex({ "phone": 1 });

print('Database initialized successfully!');


