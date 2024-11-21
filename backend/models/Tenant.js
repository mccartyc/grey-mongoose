const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true }, // Unique domain for the tenant
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Tenant", tenantSchema);
