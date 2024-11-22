// server/routes/tenantRoutes.js
const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');

router.post('/', async (req, res) => {
  const { name } = req.body;
  console.log('Received Request Body:', req.body);

  if (!name) {
    console.error('Validation Error: Name is required');
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const newTenant = new Tenant({ name });
    await newTenant.save();
    res.status(201).json(newTenant);
  } catch (error) {
    console.error('Error Creating Tenant:', error);
    res.status(400).json({ error: 'Failed to create tenant' });
  }
});

router.put('/:tenantId/deactivate', async (req, res) => {
  const { tenantId } = req.params;
  try {
    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { isActive: false, deactivatedAt: new Date() },
      { new: true }
    );
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.status(200).json(tenant);
  } catch (error) {
    console.error('Error Deactivating Tenant:', error);
    res.status(400).json({ error: 'Failed to deactivate tenant' });
  }
});

router.get('/', async (req, res) => {
  try {
    const tenants = await Tenant.find({ isActive: true });
    res.status(200).json(tenants);
  } catch (error) {
    console.error('Error Fetching Tenants:', error);
    res.status(400).json({ error: 'Failed to fetch tenants' });
  }
});

module.exports = router;
