// File: backend/scripts/deleteAllTenants.js
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const deleteAllUsers = require('../utils/deleteAllUsers');

const run = async () => {
  await connectDB();
  await deleteAllUsers();
  mongoose.connection.close();
};

run();
