// File: backend/utils/deleteAllTenants.js
const Tenant = require('../models/Tenant');

const deleteAllTenants = async () => {
  try {
    await Tenant.deleteMany({});
    console.log('All tenant records have been deleted.');
  } catch (error) {
    console.error('Error deleting tenant records:', error);
  }
};

module.exports = deleteAllTenants;
