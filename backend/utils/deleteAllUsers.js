// File: backend/utils/deleteAllTenants.js
const User = require('../models/Users');

const deleteAllUsers = async () => {
  try {
    await User.deleteMany({});
    console.log('All user records have been deleted.');
  } catch (error) {
    console.error('Error deleting user records:', error);
  }
};

module.exports = deleteAllUsers;
