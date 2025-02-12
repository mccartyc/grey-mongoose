// File: backend/server.js
const express = require('express');
const connectDB = require('./config/db'); // Import the database connection
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const debugRoutes = require('./routes/debug'); // Adjust path to debug.js
const tenantRoutes = require('./routes/tenantRoutes');
const clientRoutes = require('./routes/clientRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const eventRoutes = require('./routes/eventRoutes');
const cors = require('cors');
require('dotenv').config(); // Load .env variables

const app = express();

// Middleware
app.use(express.json());

// Enable CORS
app.use(cors());

// Use Cookie Parser
app.use(cookieParser());

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
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/debug', debugRoutes); // Prefix the route with `/api/debug`

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// Export app for testing
module.exports = app;