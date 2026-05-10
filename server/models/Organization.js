const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    maxWorkers: { type: Number, default: 20 },
    subscriptionPlan: { type: String, enum: ['free', 'basic', 'pro'], default: 'free' },
    subscriptionStatus: { type: String, enum: ['active', 'inactive', 'trial'], default: 'trial' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Organization', organizationSchema);
