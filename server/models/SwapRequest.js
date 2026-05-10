const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema({
  requestingWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  targetWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
  originalAssignmentId: { type: String, required: true }, // ID unutar assignments niza
  targetAssignmentId: { type: String, required: true }, // ID unutar assignments niza
  status: { type: String, enum: ['pending', 'accepted_by_worker', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
