const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Using ObjectId as the primary key
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  userId: { type: String, default: uuidv4, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin", "User"], default: "User" }, // User roles
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true }, // Reference to Tenant
  refreshToken: { type: String }, // Store the latest refresh token
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, required: true, default: true } // Field to indicate if user is active
});


// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
