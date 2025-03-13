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
const healthRoutes = require('./routes/health');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const { encryptionMiddleware } = require('./middleware/encryption');
const passport = require('./config/passport');
const logger = require('./config/logger'); // Import secure logger

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginEmbedderPolicy: { policy: "credentialless" }
}));

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

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Helper function to get frontend URL
    const getFrontendUrl = () => {
      return process.env.FRONTEND_URL || 'http://localhost:3000';
    };
    
    // Helper function to get API URL
    const getApiUrl = () => {
      return process.env.API_URL || 'http://localhost:5001';
    };
    
    // List of allowed origins
    const allowedOrigins = [
      getFrontendUrl(),
      getApiUrl(),
      // Netlify domains
      'https://mindcloud-beta.netlify.app',
      'https://mindcloud.netlify.app',
      // Remove trailing slash version
      'https://mindcloud.netlify.app/',
      // AWS Elastic Beanstalk domain
      'https://grey-mongoose-prod.eba-asi6kjji.us-west-2.elasticbeanstalk.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Temporarily allow all origins while debugging
    }
  },
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

// Create a raw body parser for Stripe webhooks
const stripeWebhookPath = '/api/subscriptions/webhook';
app.use((req, res, next) => {
  if (req.originalUrl === stripeWebhookPath) {
    // For Stripe webhooks, we need the raw body for signature verification
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk.toString();
    });
    req.on('end', () => {
      req.rawBody = rawBody;
      next();
    });
  } else {
    next();
  }
});

// Body parsing middleware with increased limits for audio data
// Skip body parsing for Stripe webhooks to preserve the raw body
app.use((req, res, next) => {
  if (req.originalUrl === stripeWebhookPath) {
    next();
  } else {
    express.json({ limit: '50mb' })(req, res, next);
  }
});

app.use((req, res, next) => {
  if (req.originalUrl === stripeWebhookPath) {
    next();
  } else {
    express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  }
});

app.use(cookieParser(process.env.COOKIE_SECRET));



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
app.use('/api/health', healthRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

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