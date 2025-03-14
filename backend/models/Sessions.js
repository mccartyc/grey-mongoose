const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const sessionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Using ObjectId as the primary key
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  sessionId: { type: String, default: uuidv4, unique: true },
  date: { type: Date, required: true },
  length: { type: String, required: true },
  type: { type: String, required: true },
  notes: String,
  transcript: String,
  transcriptStartTime: { type: Date },
  transcriptEndTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, required: true, default: true }
});

// Middleware to ensure tenantId is valid
sessionSchema.pre('save', async function(next) {
  const client = await mongoose.model('Client').findOne({ _id: this.clientId });
  if (!client) {
    throw new Error('Client not found');
  }
  const user = await mongoose.model('User').findOne({ _id: this.userId });
  if (!user) {
    throw new Error('User not found');
  }
  this.tenantId = client.tenantId; // Ensure tenantId is consistent
  next();
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
