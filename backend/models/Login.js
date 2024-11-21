const mongoose = require("mongoose");

const loginSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ip: { type: String },
  loginAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Login", loginSchema);
