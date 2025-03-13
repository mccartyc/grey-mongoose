const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid');
const { fieldEncryption } = require('../middleware/encryption');

const userSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Using ObjectId as the primary key
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  userId: { type: String, default: uuidv4, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Internal", "Admin", "User"], default: "User" }, // Updated roles
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true }, // Reference to Tenant
  refreshToken: { type: String }, // Store the latest refresh token
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, required: true, default: true }, // Field to indicate if user is active
  mfaEnabled: { type: Boolean, default: false },
  mfaMethod: { type: String, enum: ["sms", "email", "authenticator"], default: "email" },
  mfaPhone: { type: String },
  mfaSecret: { type: String }, // TOTP secret for authenticator app
  mfaTempSecret: { type: String }, // For storing temporary verification codes
  mfaTempSecretExpiry: { type: Date }, // Expiry time for temporary codes
  mfaBackupCodes: [{ type: String }], // Backup codes for account recovery
  subscriptionStatus: { type: String, enum: ["trial", "active", "expired"], default: "trial" },
  trialStartDate: { type: Date, default: Date.now },
  trialEndDate: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7 days from now
  subscriptionId: { type: String }, // External subscription ID (e.g., from Stripe)
  subscriptionExpiryDate: { type: Date },
  stripeCustomerId: { type: String }, // Stripe customer ID for subscription management
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Special method to find by email that handles both encrypted and unencrypted emails
userSchema.statics.findByEmail = async function(email) {
  // First try to find by unencrypted email (for existing users)
  let user = await this.findOne({ email });
  
  if (!user) {
    // If not found, try to find by encrypted email (for new users after encryption implementation)
    const encryptedEmail = fieldEncryption.encrypt(email);
    user = await this.findOne({ email: encryptedEmail });
  }
  
  return user;
};

module.exports = mongoose.model("User", userSchema);
