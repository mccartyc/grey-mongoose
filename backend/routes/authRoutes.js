// File: backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const Tenant = require('../models/Tenant');
const passport = require('../config/passport');
const { authenticateToken } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limiting for authentication operations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 login attempts per 15 minutes
  message: { error: 'Too many login attempts, please try again later' }
});

// Login route
router.post('/login', authLimiter, async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing credentials:', { email: !!email, password: !!password });
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Use the special findByEmail method that handles both encrypted and unencrypted emails
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      console.log('User account is deactivated:', email);
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user._id,
        tenantId: user.tenantId,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { 
        userId: user._id,
        tenantId: user.tenantId
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const response = {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        tenantId: user.tenantId
      }
    };
    console.log('Login successful, sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Logout route
router.post('/logout', authenticateToken, (req, res) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Error during logout' });
  }
});

// Change password route
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide current and new password' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    console.log('Password changed:', {
      userId: user._id,
      timestamp: new Date()
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstname, lastname, registrationType, tenantName, tenantId } = req.body;

    // Validate required fields without using trim()
    if (!email || !password || !firstname || !lastname) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check for existing user
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    let userTenantId;

    if (registrationType === 'individual') {
      // Create new tenant for individual/new company
      if (!tenantName) {
        return res.status(400).json({ error: 'Company name is required' });
      }

      const newTenant = new Tenant({
        name: tenantName,
        isActive: true
      });

      await newTenant.save();
      userTenantId = newTenant._id;
    } else {
      // Validate existing tenant
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const existingTenant = await Tenant.findOne({ tenantId });
      if (!existingTenant) {
        return res.status(400).json({ error: 'Invalid Tenant ID' });
      }
      if (!existingTenant.isActive) {
        return res.status(400).json({ error: 'This company account is inactive' });
      }

      userTenantId = existingTenant._id;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Set trial period dates (7 days from now)
    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    const user = new User({
      email,
      password: hashedPassword,
      firstname,
      lastname,
      role: registrationType === 'individual' ? 'Admin' : 'User',
      tenantId: userTenantId,
      isActive: true,
      // Subscription information
      subscriptionStatus: 'trial',
      trialStartDate,
      trialEndDate
    });

    await user.save();

    res.status(201).json({ 
      message: 'Registration successful',
      tenantId: registrationType === 'individual' ? user.tenantId : tenantId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Google OAuth Routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Complete Google registration with tenant selection
router.post('/google/complete-registration', async (req, res) => {
  try {
    const {
      email,
      firstname,
      lastname,
      googleId,
      registrationType,
      tenantName,
      tenantId: requestedTenantId
    } = req.body;

    // Validate required fields
    if (!email || !firstname || !lastname || !googleId || !registrationType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { googleId }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    let userTenantId;

    if (registrationType === 'individual') {
      // Create new tenant
      if (!tenantName) {
        return res.status(400).json({ error: 'Organization name is required' });
      }

      const newTenant = new Tenant({
        name: tenantName,
        isActive: true
      });

      await newTenant.save();
      userTenantId = newTenant._id;
    } else {
      // Validate existing tenant
      if (!requestedTenantId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }

      const existingTenant = await Tenant.findById(requestedTenantId);
      if (!existingTenant || !existingTenant.isActive) {
        return res.status(400).json({ error: 'Invalid or inactive organization' });
      }

      userTenantId = existingTenant._id;
    }

    // Create new user
    const newUser = await new User({
      email,
      firstname,
      lastname,
      googleId,
      isActive: true,
      role: registrationType === 'individual' ? 'Admin' : 'User',
      tenantId: userTenantId,
      // Set a secure random password for Google users
      password: require('crypto').randomBytes(32).toString('hex')
    }).save();

    // Generate tokens
    const token = jwt.sign(
      { 
        userId: newUser._id,
        tenantId: newUser.tenantId,
        role: newUser.role,
        email: newUser.email,
        firstname: newUser.firstname,
        lastname: newUser.lastname
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { 
        userId: newUser._id,
        tenantId: newUser.tenantId
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return success response
    res.json({
      token,
      user: {
        _id: newUser._id,
        email: newUser.email,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        role: newUser.role,
        tenantId: newUser.tenantId
      }
    });
  } catch (error) {
    console.error('Google registration completion error:', error);
    res.status(500).json({ error: 'Error completing registration' });
  }
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
  async (req, res) => {
    try {
      if (!req.user) {
        console.error('No user data in Google callback');
        return res.redirect('/login?error=no_user_data');
      }

      // Helper function to get frontend URL
      const getFrontendUrl = () => {
        return process.env.FRONTEND_URL || 'http://localhost:3000';
      };
      
      const frontendUrl = getFrontendUrl();

      // If this is a new user (pendingRegistration), redirect to setup page
      if (req.user.pendingRegistration) {
        const userData = {
          email: req.user.email,
          firstname: req.user.firstname,
          lastname: req.user.lastname,
          googleId: req.user.googleId
        };

        // Redirect to setup page with user data
        return res.redirect(
          `${frontendUrl}/google-auth-setup?userData=${encodeURIComponent(JSON.stringify(userData))}`
        );
      }

      // For existing users, create token and proceed with login
      const token = jwt.sign(
        { 
          userId: req.user._id,
          tenantId: req.user.tenantId,
          role: req.user.role,
          email: req.user.email,
          firstname: req.user.firstname,
          lastname: req.user.lastname
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { 
          userId: req.user._id,
          tenantId: req.user.tenantId
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set refresh token cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Log successful authentication
      console.log('Google authentication successful for existing user:', {
        userId: req.user._id,
        email: req.user.email,
        tenantId: req.user.tenantId,
        role: req.user.role
      });

      // Redirect to frontend with token
      res.redirect(`${frontendUrl}/auth-callback?token=${token}`);
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
);

// Refresh token route
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const decoded = await jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const token = jwt.sign(
      { 
        userId: user._id,
        tenantId: user.tenantId,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

module.exports = router;
