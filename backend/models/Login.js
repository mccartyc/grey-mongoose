const mongoose = require("mongoose");

const loginSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Using ObjectId as the primary key
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ip: { type: String },
  loginAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Login", loginSchema);
