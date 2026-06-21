const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  subscription: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);