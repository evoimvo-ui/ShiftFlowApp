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
    maxWorkers: { type: Number, default: 15 },
    subscriptionPlan: { type: String, enum: ['basic', 'premium', 'business'], default: 'basic' },
    subscriptionStatus: { type: String, enum: ['trial', 'active', 'past_due', 'canceled', 'paused'], default: 'trial' },
    trialEndsAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paddleCustomerId: { type: String, default: null },
  paddleSubscriptionId: { type: String, default: null },
  currentPeriodEnd: { type: Date, default: null }
});

module.exports = mongoose.model('Organization', organizationSchema);
