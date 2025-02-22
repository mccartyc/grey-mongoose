const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Nzc4NmVhZTNiYzcyYzRlOGY4MzVmM2IiLCJ0ZW5hbnRJZCI6IjY3NjE3ZDY2NjZjYWRhZmY1ZjgyZTFiZCIsInJvbGUiOiJVc2VyIiwiaWF0IjoxNzQwMTgxODYxLCJleHAiOjE3NDAxODU0NjF9.eOCnX5BZCc20NQp1ENBZlvAcWzn1bGAsReb1CNnmKN8';
const tenantId = '67617d6666cadaff5f82e1bd';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const userId = '67786eae3bc72c4e8f835f3b';

const newClients = [
  {
    firstName: 'Michael',
    lastName: 'Thompson',
    email: 'mthompson@example.com',
    phone: '208-555-1234',
    birthday: '1990-05-15',
    gender: 'Male',
    streetAddress: '456 Pine St',
    city: 'Boise',
    state: 'ID',
    zipcode: '83702',
    tenantId,
    userId
  },
  {
    firstName: 'Sarah',
    lastName: 'Anderson',
    email: 'sanderson@example.com',
    phone: '208-555-5678',
    birthday: '1988-09-22',
    gender: 'Female',
    streetAddress: '789 Oak Ave',
    city: 'Boise',
    state: 'ID',
    zipcode: '83702',
    tenantId,
    userId
  },
  {
    firstName: 'David',
    lastName: 'Martinez',
    email: 'dmartinez@example.com',
    phone: '208-555-9012',
    birthday: '1995-03-10',
    gender: 'Male',
    streetAddress: '321 Maple Dr',
    city: 'Boise',
    state: 'ID',
    zipcode: '83702',
    tenantId,
    userId
  }
];

const sessionTypes = ['Client Session', 'Internal Meeting', 'Preparation', 'Personal'];
const sessionLengths = ['30', '45', '60'];

async function addTestData() {
  try {
    // Add new clients
    const createdClients = await Promise.all(
      newClients.map(client => api.post('/clients', client))
    );
    console.log('Added new clients:', createdClients.map(res => res.data.firstName + ' ' + res.data.lastName).join(', '));

    // Get all clients for this user
    const { data: allClients } = await api.get(`/clients?userId=${userId}`);
    const clientIds = allClients.map(c => c._id);
    console.log('Found clients:', allClients.map(c => c.firstName + ' ' + c.lastName).join(', '));

    // Generate 10 sessions across different dates
    const now = new Date();
    const sessions = [];

    // Past sessions
    for (let i = 0; i < 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 14)); // Random day in past 2 weeks
      date.setHours(9 + Math.floor(Math.random() * 8), 0, 0); // Between 9 AM and 5 PM

      const session = {
        clientId: clientIds[Math.floor(Math.random() * clientIds.length)],
        date: date.toISOString(),
        length: sessionLengths[Math.floor(Math.random() * sessionLengths.length)],
        type: sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
        notes: 'Test session notes',
        userId,
        tenantId
      };
      console.log('Creating session:', session);
      sessions.push(session);
    }

    // Future sessions
    for (let i = 0; i < 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + Math.floor(Math.random() * 14)); // Random day in next 2 weeks
      date.setHours(9 + Math.floor(Math.random() * 8), 0, 0); // Between 9 AM and 5 PM

      const session = {
        clientId: clientIds[Math.floor(Math.random() * clientIds.length)],
        date: date.toISOString(),
        length: sessionLengths[Math.floor(Math.random() * sessionLengths.length)],
        type: sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
        notes: 'Test session notes',
        userId,
        tenantId
      };
      console.log('Creating session:', session);
      sessions.push(session);
    }

    // Add sessions
    const createdSessions = await Promise.all(
      sessions.map(session => api.post('/sessions', session))
    );
    console.log('Added new sessions:', createdSessions.length);

    console.log('Test data added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding test data:', error.response?.data || error.message);
    process.exit(1);
  }
}

addTestData();
