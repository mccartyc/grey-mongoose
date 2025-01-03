// File: backend/server.js
const express = require('express');
const connectDB = require('./config/db'); // Import the database connection
const tenantRoutes = require('./routes/tenantRoutes');
const clientRoutes = require('./routes/clientRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const cors = require('cors');
require('dotenv').config(); // Load .env variables

const app = express();

// Middleware
app.use(express.json());

// Enable CORS

app.use(cors());

const PORT = process.env.PORT || 5001;

// Allow requests from the frontend
app.use(cors({
  origin: "http://localhost:3000", // Your frontend URL
  credentials: true, // Allow cookies and authorization headers
}));

// app.use(cors());

// Connect to MongoDB
connectDB();

// Routes
// app.use('/api/users', require('./routes/authRoutes'));
app.use('/api/tenants', tenantRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// Export app for testing
module.exports = app;