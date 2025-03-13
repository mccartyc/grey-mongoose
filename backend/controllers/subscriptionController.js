// File: backend/controllers/subscriptionController.js
const User = require('../models/Users');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Check trial status
exports.checkTrialStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate days left in trial
    const now = new Date();
    const trialEndDate = new Date(user.trialEndDate);
    const daysLeft = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

    // Check if trial has expired
    if (daysLeft <= 0 && user.subscriptionStatus === 'trial') {
      user.subscriptionStatus = 'expired';
      await user.save();
      return res.status(200).json({
        subscriptionStatus: 'expired',
        message: 'Your trial has expired. Please subscribe to continue using the service.',
        daysLeft: 0
      });
    }

    return res.status(200).json({
      subscriptionStatus: user.subscriptionStatus,
      daysLeft: Math.max(0, daysLeft),
      trialEndDate: user.trialEndDate,
      subscriptionExpiryDate: user.subscriptionExpiryDate
    });
  } catch (error) {
    console.error('Error checking trial status:', error);
    res.status(500).json({ error: 'Error checking trial status' });
  }
};

// Create subscription checkout session using Stripe's prebuilt checkout
exports.createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or retrieve a customer
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstname} ${user.lastname}`,
        metadata: {
          userId: user._id.toString()
        }
      });
      
      // Save the customer ID to the user
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create a new product or retrieve existing one
    let product;
    const existingProducts = await stripe.products.list({
      limit: 1,
      active: true
    });
    
    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
    } else {
      product = await stripe.products.create({
        name: 'MindCloud Subscription',
        description: 'Monthly subscription to MindCloud'
      });
    }

    // Create a price for the product or retrieve existing one
    let price;
    const existingPrices = await stripe.prices.list({
      limit: 1,
      active: true,
      product: product.id
    });
    
    if (existingPrices.data.length > 0) {
      price = existingPrices.data[0];
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: 1500, // $15.00
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          product_id: product.id
        }
      });
    }

    // Create a checkout session with Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/settings?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/settings?subscription=cancel`,
      client_reference_id: user._id.toString(),
      subscription_data: {
        metadata: {
          userId: user._id.toString()
        }
      }
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
};

// Handle webhook events from Stripe
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Use the raw body for signature verification
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Find the user either by client_reference_id or by customer ID
        let user;
        if (session.client_reference_id) {
          user = await User.findById(session.client_reference_id);
        } else if (session.customer) {
          user = await User.findOne({ stripeCustomerId: session.customer });
        }
        
        if (user && session.subscription) {
          // Update user subscription status
          user.subscriptionStatus = 'active';
          user.subscriptionId = session.subscription;
          
          // Set expiry date to 1 month from now (will be updated with actual period end from Stripe)
          user.subscriptionExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await user.save();
          
          console.log(`User ${user._id} subscription activated: ${session.subscription}`);
        }
        break;
        
      case 'invoice.paid':
        const invoice = event.data.object;
        
        if (invoice.subscription) {
          // First try to find user by subscription ID
          let user = await User.findOne({ subscriptionId: invoice.subscription });
          
          // If not found, try to find by customer ID
          if (!user && invoice.customer) {
            user = await User.findOne({ stripeCustomerId: invoice.customer });
          }
          
          if (user) {
            // Get the subscription details to get the current period end
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            
            // Update the user's subscription expiry date to the current period end
            const newExpiryDate = new Date(subscription.current_period_end * 1000);
            
            user.subscriptionExpiryDate = newExpiryDate;
            user.subscriptionStatus = 'active';
            user.subscriptionId = invoice.subscription; // Ensure subscription ID is set
            
            await user.save();
            console.log(`User ${user._id} subscription renewed until ${newExpiryDate}`);
          }
        }
        break;
        
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        
        // Find user by subscription ID or customer ID
        let userToUpdate = await User.findOne({ subscriptionId: updatedSubscription.id });
        if (!userToUpdate && updatedSubscription.customer) {
          userToUpdate = await User.findOne({ stripeCustomerId: updatedSubscription.customer });
        }
        
        if (userToUpdate) {
          // Update cancel_at_period_end status if needed
          if (updatedSubscription.cancel_at_period_end) {
            console.log(`Subscription ${updatedSubscription.id} set to cancel at period end`);
          } else {
            console.log(`Subscription ${updatedSubscription.id} updated`);
          }
          
          // Always ensure the subscription ID is set
          userToUpdate.subscriptionId = updatedSubscription.id;
          await userToUpdate.save();
        }
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        
        // Find user by subscription ID or customer ID
        let userToExpire = await User.findOne({ subscriptionId: deletedSubscription.id });
        if (!userToExpire && deletedSubscription.customer) {
          userToExpire = await User.findOne({ stripeCustomerId: deletedSubscription.customer });
        }
        
        if (userToExpire) {
          userToExpire.subscriptionStatus = 'expired';
          userToExpire.subscriptionId = null;
          await userToExpire.save();
          console.log(`User ${userToExpire._id} subscription expired`);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
};

// Get current subscription
exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user has an active subscription, fetch details from Stripe
    if (user.subscriptionStatus === 'active' && user.subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
        return res.status(200).json({
          subscriptionStatus: user.subscriptionStatus,
          subscriptionId: user.subscriptionId,
          subscriptionExpiryDate: user.subscriptionExpiryDate,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          priceId: subscription.items.data[0].price.id,
          productId: subscription.items.data[0].price.product,
        });
      } catch (error) {
        console.error('Error fetching subscription from Stripe:', error);
        // If there's an error with Stripe, still return the basic info
      }
    }

    // Return basic subscription info
    return res.status(200).json({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionId: user.subscriptionId,
      subscriptionExpiryDate: user.subscriptionExpiryDate,
      trialEndDate: user.trialEndDate
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ error: 'Error getting subscription details' });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true
    });

    res.status(200).json({ 
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Error canceling subscription' });
  }
};

// Resume canceled subscription
exports.resumeSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscriptionId) {
      return res.status(400).json({ error: 'No subscription found to resume' });
    }

    // Resume subscription by setting cancel_at_period_end to false
    const subscription = await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: false
    });

    res.status(200).json({ 
      message: 'Subscription resumed successfully',
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({ error: 'Error resuming subscription' });
  }
};
