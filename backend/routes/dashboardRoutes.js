const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/authMiddleware');
const Session = require('../models/Sessions');
const Client = require('../models/Clients');
const Event = require('../models/Events'); // Import the Event model
const rateLimit = require('express-rate-limit');

// Rate limiting for dashboard operations
const dashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // 500 requests per 15-minute window
});

// Apply rate limiting to all dashboard routes
router.use(dashboardLimiter);

// Middleware to ensure all routes require authentication
router.use(authenticateToken);

// Get dashboard metrics
router.get('/metrics', async (req, res) => {
  console.log('Dashboard metrics endpoint hit');
  console.log('User from token:', req.user);
  
  if (!req.user?.userId || !req.user?.tenantId) {
    console.error('Missing user data:', req.user);
    return res.status(400).json({ error: 'Invalid user data in token' });
  }

  try {
    const { userId, tenantId } = req.user;
    const now = new Date();
    const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Convert IDs to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);

    // Get total clients
    const totalClients = await Client.countDocuments({ 
      tenantId: tenantObjectId,
      userId: userObjectId,
      isActive: true 
    });

    // Get total sessions
    const totalSessions = await Session.countDocuments({ 
      tenantId: tenantObjectId,
      userId: userObjectId,
      isActive: true 
    });

    // Get sessions in the last week
    const sessionsLastWeek = await Session.countDocuments({
      tenantId: tenantObjectId,
      userId: userObjectId,
      date: { $gte: lastWeekStart },
      isActive: true
    });

    // Get sessions in the last month
    const sessionsLastMonth = await Session.countDocuments({
      tenantId: tenantObjectId,
      userId: userObjectId,
      date: { $gte: lastMonthStart },
      isActive: true
    });

    // Get session type distribution
    const sessionTypes = await Session.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          userId: userObjectId,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get this month's sessions
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthSessions = await Session.countDocuments({
      tenantId: tenantObjectId,
      userId: userObjectId,
      date: { $gte: thisMonthStart },
      isActive: true
    });

    // Get client growth over time (last 6 months)
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const clientGrowth = await Client.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          userId: userObjectId,
          createdAt: { $gte: sixMonthsAgo },
          isActive: true
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get upcoming sessions (next 30 days)
    // Create a date for today at midnight
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Create a date for 30 days from now at 23:59:59
    const thirtyDaysLater = new Date(todayStart);
    thirtyDaysLater.setDate(todayStart.getDate() + 30);
    thirtyDaysLater.setHours(23, 59, 59, 999);
    
    console.log('Upcoming sessions date range:', todayStart.toISOString(), 'to', thirtyDaysLater.toISOString());
    
    // Query for upcoming client sessions from the events table
    const upcomingSessions = await Event.countDocuments({
      tenantId: tenantObjectId,
      userId: userObjectId,
      category: 'Client Session',
      start: { 
        $gte: todayStart,
        $lte: thirtyDaysLater
      }
    });
    
    console.log('Upcoming client sessions count from events table:', upcomingSessions);

    res.json({
      totalClients,
      totalSessions,
      sessionsLastWeek,
      sessionsLastMonth,
      sessionTypes,
      thisMonthSessions,
      clientGrowth,
      upcomingSessions,
      // Get 5 most recent sessions with client names
      recentSessions: await Session.aggregate([
        {
          $match: {
            tenantId: tenantObjectId,
            userId: userObjectId,
            isActive: true,
            date: { $lte: now }
          }
        },
        {
          $sort: { date: -1 }
        },
        {
          $limit: 5
        },
        {
          $lookup: {
            from: 'clients',
            localField: 'clientId',
            foreignField: '_id',
            as: 'client'
          }
        },
        {
          $project: {
            date: 1,
            type: 1,
            clientName: { $concat: [{ $arrayElemAt: ['$client.firstName', 0] }, ' ', { $arrayElemAt: ['$client.lastName', 0] }] }
          }
        }
      ])
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      userId: req.user?.userId,
      tenantId: req.user?.tenantId
    });
    res.status(500).json({ 
      error: 'Failed to fetch dashboard metrics',
      details: error.message
    });
  }
});

module.exports = router;
