const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  therapist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  notes: { type: String },
  date: { type: Date, required: true },
  duration: { type: Number }, // Duration in minutes
});

module.exports = mongoose.model("Session", sessionSchema);
