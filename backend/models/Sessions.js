const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const sessionSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, default: uuidv4, unique: true },
  date: { type: Date, required: true },
  timeMet: { type: String, required: true },
  notes: String
});

// Middleware to ensure tenantId is valid
sessionSchema.pre('save', async function(next) {
  const client = await mongoose.model('Client').findById(this.clientId);
  if (!client) {
    throw new Error('Client not found');
  }
  const therapist = await mongoose.model('User').findById(this.therapistId);
  if (!therapist) {
    throw new Error('Therapist not found');
  }
  this.tenantId = client.tenantId; // Ensure tenantId is consistent
  next();
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
