// server/routes/tenantRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateObjectId, sanitizeData } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');
const Tenant = require('../models/Tenant');

// Rate limiting for tenant operations
const tenantLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50 // limit each IP to 50 tenant operations per hour
});

// Ensure all routes require authentication
router.use(authenticateToken);
router.use(sanitizeData);

// Validate tenant data
const validateTenantData = (req, res, next) => {
  const { name, address, phone, email, adminEmail } = req.body;

  if (!name || !adminEmail) {
    return res.status(400).json({ error: 'Name and admin email are required' });
  }

  if (email && !validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid organization email format' });
  }

  if (adminEmail && !validateEmail(adminEmail)) {
    return res.status(400).json({ error: 'Invalid admin email format' });
  }

  if (phone && !validatePhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone format' });
  }

  next();
};

// Audit logging middleware
const auditTenantAction = (action) => (req, res, next) => {
  const log = {
    timestamp: new Date(),
    userId: req.user.userId,
    tenantId: req.params.id || req.user.tenantId,
    action,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    details: {
      method: req.method,
      path: req.path,
      changes: req.method === 'PUT' ? req.body : undefined
    }
  };
  
  // Log to secure audit system
  console.log('Tenant Action Audit:', JSON.stringify(log));
  next();
};

// Check tenant admin permissions
const checkTenantAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ 
        error: 'Access denied. Tenant admin privileges required.' 
      });
    }
    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ 
      error: 'Failed to verify permissions',
      requestId: req.requestId
    });
  }
};

// Create new Tenant
router.post('/',
  tenantLimiter,
  checkTenantAdmin,
  validateTenantData,
  auditTenantAction('CREATE_TENANT'),
  async (req, res) => {
    try {
      const { name } = req.body;
      console.log('Received Request Body:', req.body);

      if (!name) {
        console.error('Validation Error: Name is required');
        return res.status(400).json({ error: 'Name is required' });
      }

      const newTenant = new Tenant({ name });
      await newTenant.save();
      res.status(201).json(newTenant);
    } catch (error) {
      console.error('Error Creating Tenant:', error);
      res.status(400).json({ error: 'Failed to create tenant' });
    }
  }
);

// Deactivate Tenant
router.put('/:tenantId/deactivate',
  validateObjectId,
  checkTenantAdmin,
  auditTenantAction('DEACTIVATE_TENANT'),
  async (req, res) => {
    const { _id } = req.params;
    try {
      const updateData = { isActive: false, deactivatedAt: new Date() };
      console.log('Update Data:', updateData); // Log the update data
  
      const tenant = await Tenant.findOneAndUpdate(
        { _id },
        updateData,
        { new: true }
      );
  
      if (!tenant) {
        console.log(`Tenant with ID ${_id} not found`); // Log if tenant not found
        return res.status(404).json({ error: 'Tenant not found' });
      }
  
      console.log('Deactivated Tenant:', tenant); // Log the deactivated tenant
      res.status(200).json(tenant);
    } catch (error) {
      console.error('Error Deactivating Tenant:', error);
      res.status(400).json({ error: 'Failed to deactivate tenant' });
    }
  }
);

// Update Tenant
router.put('/:tenantId',
  validateObjectId,
  checkTenantAdmin,
  validateTenantData,
  auditTenantAction('UPDATE_TENANT'),
  async (req, res) => {
    const { _id } = req.params;
    const { name } = req.body;

    try {
      // Update the tenant in the database
      const updatedTenant = await Tenant.findOneAndUpdate(
        { _id }, // Assuming tenantId is a field in your schema
        { name },
        { new: true, runValidators: true } // new: return the updated doc, runValidators: ensure validators run
      );

      if (!updatedTenant) {
        return res.status(404).send('Tenant not found');
      }

      res.status(200).json(updatedTenant);
    } catch (error) {
      console.error('Error updating tenant:', error);
      res.status(500).send('Server error');
    }
  }
);

// Retrieve Tenants
router.get('/',
  auditTenantAction('VIEW_TENANTS'),
  async (req, res) => {
    try {
      const tenants = await Tenant.find({ isActive: true });
      res.status(200).json(tenants);
    } catch (error) {
      console.error('Error Fetching Tenants:', error);
      res.status(400).json({ error: 'Failed to fetch tenants' });
    }
  }
);

module.exports = router;
