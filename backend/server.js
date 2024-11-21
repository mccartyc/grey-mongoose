// File: backend/server.js

const express = require('express');
const { connectDB } = require('./config/db'); // Import the database connection
require('dotenv').config(); // Load .env variables

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/users', require('./routes/userRoutes'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
