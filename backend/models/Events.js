// backend/models/Event.js

const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
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
