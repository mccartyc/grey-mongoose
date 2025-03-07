// File: backend/server.js
require('dotenv').config(); // Load .env variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { configureSecurityMiddleware } = require('./middleware/security');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const debugRoutes = require('./routes/debug');
const tenantRoutes = require('./routes/tenantRoutes');
const clientRoutes = require('./routes/clientRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const eventRoutes = require('./routes/eventRoutes');
const transcriptRoutes = require('./routes/transcriptRoutes');
const transcribeRoutes = require('./routes/transcribe');
const dashboardRoutes = require('./routes/dashboardRoutes');
const mfaRoutes = require('./routes/mfaRoutes');
const intakeRoutes = require('./routes/intakeRoutes');
const { encryptionMiddleware } = require('./middleware/encryption');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginEmbedderPolicy: { policy: "credentialless" }
}));

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parsing middleware with increased limits for audio data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  name: 'sessionId',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

app.use(session(sessionConfig));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased from 100 to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Encryption middleware for sensitive data
app.use(encryptionMiddleware);

// Connect to MongoDB
connectDB();

// Debug middleware to log all requests
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  req.requestId = requestId;
  console.log(`[${requestId}] ${req.method} ${req.path}`);
  next();
});

// Add request ID to all responses
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(body) {
    if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
      body.requestId = req.requestId;
    }
    return originalSend.call(this, body);
  };
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/intake-forms', intakeRoutes);

// Debug: Log all registered routes
const listEndpoints = require('express-list-endpoints');
console.log('Registered Routes:', JSON.stringify(listEndpoints(app), null, 2));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err.message);
  console.error(`[${req.requestId}] Stack:`, err.stack);
  
  // Log additional information for debugging
  if (req.body) {
    console.error(`[${req.requestId}] Request body:`, JSON.stringify({
      ...req.body,
      // Don't log sensitive information
      email: req.body.email ? '[REDACTED]' : undefined,
      phone: req.body.phone ? '[REDACTED]' : undefined,
      password: req.body.password ? '[REDACTED]' : undefined,
    }));
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    requestId: req.requestId
  });
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Keep the process alive but log the error
});

const PORT = process.env.PORT || 5001;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Performing graceful shutdown...');
  server.close(() => {
    console.log('Server closed. Process terminating...');
    process.exit(0);
  });
});

// Export app for testing
module.exports = app;