// File: backend/config/db.js

const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config(); // Load environment variables

const uri = process.env.MONGO_URI; // Fetch the MongoDB URI from the .env file

// Create a MongoClient instance with Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB and ping the server
const connectDB = async () => {
  try {
    await client.connect(); // Establish connection to MongoDB
    await client.db('admin').command({ ping: 1 }); // Ping MongoDB to verify the connection
    console.log('MongoDB connection successful!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit the process if the connection fails
  }
};

module.exports = { connectDB, client };
