const mongoose = require('mongoose');
const Client = require('../models/Clients');
const Session = require('../models/Sessions');
require('dotenv').config();

const tenantId = '67617d6666cadaff5f82e1bd';
const userId = '67786eae3bc72c4e8f835f3b';

const newClients = [
  {
    firstName: 'Michael',
    lastName: 'Thompson',
    email: 'mthompson@example.com',
    phone: '208-555-1234',
    birthday: new Date('1990-05-15'),
    gender: 'Male',
    streetAddress: '456 Pine St',
    city: 'Boise',
    state: 'ID',
    zipcode: '83702',
    tenantId,
    userId,
    isActive: true
  },
  {
    firstName: 'Sarah',
    lastName: 'Anderson',
    email: 'sanderson@example.com',
    phone: '208-555-5678',
    birthday: new Date('1988-09-22'),
    gender: 'Female',
    streetAddress: '789 Oak Ave',
    city: 'Boise',
    state: 'ID',
    zipcode: '83702',
    tenantId,
    userId,
    isActive: true
  },
  {
    firstName: 'David',
    lastName: 'Martinez',
    email: 'dmartinez@example.com',
    phone: '208-555-9012',
    birthday: new Date('1995-03-10'),
    gender: 'Male',
    streetAddress: '321 Maple Dr',
    city: 'Boise',
    state: 'ID',
    zipcode: '83702',
    tenantId,
    userId,
    isActive: true
  }
];

const sessionTypes = ['Client Session', 'Internal Meeting', 'Preparation', 'Personal'];
const sessionLengths = ['30', '45', '60'];

async function addTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000
    });
    console.log('Connected to MongoDB');

    // Add new clients
    const createdClients = await Client.insertMany(newClients);
    console.log('Added new clients:', createdClients.map(c => c.firstName + ' ' + c.lastName).join(', '));

    // Create array for all client IDs (including existing ones)
    const allClients = await Client.find({ tenantId, userId, isActive: true });
    const clientIds = allClients.map(c => c._id);

    // Generate 10 sessions across different dates
    const sessions = [];
    const now = new Date();
    
    // Past sessions
    for (let i = 0; i < 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 14)); // Random day in past 2 weeks
      date.setHours(9 + Math.floor(Math.random() * 8), 0, 0); // Between 9 AM and 5 PM

      sessions.push({
        tenantId,
        userId,
        clientId: clientIds[Math.floor(Math.random() * clientIds.length)],
        date,
        length: sessionLengths[Math.floor(Math.random() * sessionLengths.length)],
        type: sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
        notes: 'Test session notes',
        isActive: true
      });
    }

    // Future sessions
    for (let i = 0; i < 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + Math.floor(Math.random() * 14)); // Random day in next 2 weeks
      date.setHours(9 + Math.floor(Math.random() * 8), 0, 0); // Between 9 AM and 5 PM

      sessions.push({
        tenantId,
        userId,
        clientId: clientIds[Math.floor(Math.random() * clientIds.length)],
        date,
        length: sessionLengths[Math.floor(Math.random() * sessionLengths.length)],
        type: sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
        notes: 'Test session notes',
        isActive: true
      });
    }

    // Add sessions
    const createdSessions = await Session.insertMany(sessions);
    console.log('Added new sessions:', createdSessions.length);

    console.log('Test data added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding test data:', error);
    process.exit(1);
  }
}

addTestData();
