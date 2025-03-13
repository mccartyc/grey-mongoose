
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const tenantSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Using ObjectId as the primary key
  tenantId: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true, required: true },
  deactivatedAt: { type: Date }
});

const Tenant = mongoose.model('Tenant', tenantSchema);
module.exports = Tenant;
