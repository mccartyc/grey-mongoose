// File: backend/scripts/deleteAllTenants.js
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const deleteAllTenants = require('../utils/deleteAllTenants');

const run = async () => {
  await connectDB();
  await deleteAllTenants();
  mongoose.connection.close();
};

run();
