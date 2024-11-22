const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const clientSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  notes: String
});

// Middleware to ensure tenantId and therapistId are valid
clientSchema.pre('save', async function(next) {
  const therapist = await mongoose.model('User').findById(this.therapistId);
  if (!therapist) {
    throw new Error('Therapist not found');
  }
  this.tenantId = therapist.tenantId; // Ensure tenantId is consistent
  next();
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
