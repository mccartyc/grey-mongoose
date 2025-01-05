// server/routes/tenantRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Tenant = require('../models/Tenant');

router.post('/', protect, async (req, res) => {
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

router.put('/:tenantId/deactivate', protect, async (req, res) => {
    const { tenantId } = req.params;
    try {
      const updateData = { isActive: false, deactivatedAt: new Date() };
      console.log('Update Data:', updateData); // Log the update data
  
      const tenant = await Tenant.findOneAndUpdate(
        { tenantId },
        updateData,
        { new: true }
      );
  
      if (!tenant) {
        console.log(`Tenant with ID ${tenantId} not found`); // Log if tenant not found
        return res.status(404).json({ error: 'Tenant not found' });
      }
  
      console.log('Deactivated Tenant:', tenant); // Log the deactivated tenant
      res.status(200).json(tenant);
    } catch (error) {
      console.error('Error Deactivating Tenant:', error);
      res.status(400).json({ error: 'Failed to deactivate tenant' });
    }
  });

router.put('/:tenantId', protect, async (req, res) => {
  const { tenantId } = req.params;
  const { name } = req.body;

  try {
    // Update the tenant in the database
    const updatedTenant = await Tenant.findOneAndUpdate(
      { tenantId }, // Assuming tenantId is a field in your schema
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
});
  

router.get('/', protect, async (req, res) => {
  try {
    const tenants = await Tenant.find({ isActive: true });
    res.status(200).json(tenants);
  } catch (error) {
    console.error('Error Fetching Tenants:', error);
    res.status(400).json({ error: 'Failed to fetch tenants' });
  }
  });

module.exports = router;
