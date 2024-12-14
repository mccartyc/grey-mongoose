const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // Drop in-memory database
  await mongoose.connection.close();        // Close mongoose connection
  await mongoServer.stop();                 // Stop the MongoMemoryServer
});
