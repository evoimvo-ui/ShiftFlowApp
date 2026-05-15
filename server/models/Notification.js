const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  type: { 
    type: String, 
    enum: ['swap_request', 'swap_response', 'swap_approval', 'absence_request', 'absence_response'], 
    required: true 
  },
  relatedId: { type: mongoose.Schema.Types.ObjectId, required: true }, // SwapRequest ili Absence ID
  title: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['unread', 'read', 'actioned'], default: 'unread' },
  createdAt: { type: Date, default: Date.now },
  readAt: { type: Date },
  actionedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
