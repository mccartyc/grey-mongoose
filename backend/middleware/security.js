const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Session configuration for secure cookies
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  name: 'sessionId', // Don't use default connect.sid
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60, // 1 hour
    sameSite: 'lax', // Changed from strict to lax for cross-origin requests
  },
  resave: false,
  saveUninitialized: true, // Changed to true to ensure session is always created
};

// Audit logging middleware
const auditLog = (req, res, next) => {
  const log = {
    timestamp: new Date(),
    action: `${req.method} ${req.originalUrl}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  };

  // Only include user info if available
  if (req.user) {
    log.userId = req.user.userId;
    log.tenantId = req.user.tenantId;
  }

  // Log to your secure logging system
  console.log('Audit Log:', JSON.stringify(log));
  next();
};

// HIPAA compliance headers
const hipaaSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

// Idle session timeout middleware
const idleSessionTimeout = (req, res, next) => {
  // Initialize session if it doesn't exist
  if (!req.session) {
    req.session = {};
  }

  const currentTime = Date.now();
  
  if (req.session.lastActivity) {
    const idleTime = currentTime - req.session.lastActivity;
    const maxIdleTime = 1000 * 60 * 30; // 30 minutes

    if (idleTime > maxIdleTime) {
      // Destroy session if idle for too long
      if (req.session.destroy) {
        return req.session.destroy(() => {
          res.status(440).json({ message: 'Session expired due to inactivity' });
        });
      } else {
        // If session.destroy is not available, just clear lastActivity
        delete req.session.lastActivity;
        return res.status(440).json({ message: 'Session expired due to inactivity' });
      }
    }
  }
  
  // Update last activity time
  req.session.lastActivity = currentTime;
  next();
};

// Export security middleware chain
module.exports = {
  configureSecurityMiddleware: (app) => {
    // Basic security headers
    app.use(helmet());
    
    // HIPAA specific headers
    app.use(hipaaSecurityHeaders);
    
    // Prevent parameter pollution
    app.use(hpp());
    
    // Sanitize data
    app.use(mongoSanitize());
    
    // Prevent XSS attacks
    app.use(xss());
    
    // Rate limiting
    app.use('/api/', limiter);
    
    // Audit logging
    app.use(auditLog);
    
    // Session timeout
    app.use(idleSessionTimeout);

    return sessionConfig;
  },
  sessionConfig
};
