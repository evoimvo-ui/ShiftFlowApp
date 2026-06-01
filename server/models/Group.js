const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Osiguraj da ime grupe bude jedinstveno unutar iste organizacije
groupSchema.index({ name: 1, organizationId: 1 }, { unique: true });

module.exports = mongoose.model('Group', groupSchema);
