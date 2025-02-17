const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const clientSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Using ObjectId as the primary key
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true }, // Reference to Tenant
  userId: {  type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  clientId: { type: String, default: uuidv4, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  streetAddress: { type: String, required: false },
  birthday: {type: Date},
  gender: {type: String},
  city: { type: String, required: false },
  state: { type: String, required: false },
  zipcode: { type: String, required: false },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, required: true, default: true }
});

// Middleware to ensure tenantId and userId are valid
clientSchema.pre('save', async function(next) {
  const user = await mongoose.model('User').findOne({ _id: this.userId });
  if (!user) {
    throw new Error('User not found');
  }
  this.tenantId = user.tenantId; // Ensure tenantId is consistent
  next();
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
