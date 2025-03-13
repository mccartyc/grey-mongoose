// File: backend/routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const subscriptionController = require('../controllers/subscriptionController');

// Check trial status
router.get('/trial-status', authenticateToken, subscriptionController.checkTrialStatus);

// Create checkout session for subscription
router.post('/create-checkout-session', authenticateToken, subscriptionController.createCheckoutSession);

// Webhook for Stripe events - using raw body parser from server.js
router.post('/webhook', subscriptionController.handleWebhook);

// Get current subscription
router.get('/current', authenticateToken, subscriptionController.getCurrentSubscription);

// Cancel subscription
router.post('/cancel', authenticateToken, subscriptionController.cancelSubscription);

// Resume subscription
router.post('/resume', authenticateToken, subscriptionController.resumeSubscription);

module.exports = router;
