const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const sessionSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  clientId: { type: String, ref: 'Client', required: true },
  userId: { type: String, ref: 'User', required: true },
  sessionId: { type: String, default: uuidv4, unique: true },
  date: { type: Date, required: true },
  length: { type: String, required: true },
  type: { type: String, required: true },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, required: true, default: true }
});

// Middleware to ensure tenantId is valid
sessionSchema.pre('save', async function(next) {
  const client = await mongoose.model('Client').findById(this.clientId);
  if (!client) {
    throw new Error('Client not found');
  }
  const user = await mongoose.model('User').findById(this.userId);
  if (!user) {
    throw new Error('User not found');
  }
  this.tenantId = client.tenantId; // Ensure tenantId is consistent
  next();
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
