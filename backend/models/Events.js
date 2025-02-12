// backend/models/Event.js

const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Using ObjectId as the primary key
  tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tenant'},
  userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
  clientId: {type: mongoose.Schema.Types.ObjectId, ref: 'Client'},
  title: {type: String, required: true},
  description: {type: String},
  category: {type: String, enum: ['Client Session', 'Internal Meeting', 'Preparation', 'Out of Office', 'Personal', 'Other'], default: 'Other'},
  start: {type: Date,required: true},
  end: {type: Date,required: true},
  allDay: {type: Boolean,default: false},
  createdAt: {type: Date,default: Date.now},
  updatedAt: {type: Date,default: Date.now}
});

module.exports = mongoose.model('Event', EventSchema);
