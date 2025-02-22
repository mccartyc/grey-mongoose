const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String
  },
  tags: [{
    type: String
  }],
  metadata: {
    type: Map,
    of: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add text index for search
transcriptSchema.index({ content: 'text', summary: 'text', tags: 'text' });

// Pre-save middleware to update timestamps
transcriptSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Transcript = mongoose.model('Transcript', transcriptSchema);

module.exports = Transcript;
