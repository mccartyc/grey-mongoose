const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant' },
});

module.exports = mongoose.model('User', userSchema);
