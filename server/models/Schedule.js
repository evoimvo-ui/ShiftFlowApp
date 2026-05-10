const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  shiftId: String,
  dayOffset: Number,
  isWarning: { type: Boolean, default: false },
  needed: Number
});

const scheduleSchema = new mongoose.Schema({
  weekStart: { type: String, required: true }, // ISO Date YYYY-MM-DD
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  assignments: [assignmentSchema],
  workerHours: {
    type: Map,
    of: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
