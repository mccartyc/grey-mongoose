// File: backend/server.js
const express = require('express');
const connectDB = require('./config/db'); // Import the database connection
const tenantRoutes = require('./routes/tenantRoutes');
const clientRoutes = require('./routes/clientRoutes');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');
require('dotenv').config(); // Load .env variables

const app = express();

// Enable CORS
app.use(cors());

const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
// app.use('/api/users', require('./routes/authRoutes'));
app.use('/api/tenants', tenantRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
