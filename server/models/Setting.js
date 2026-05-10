const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
  minRestHours: { type: Number, default: 11 },
  maxHoursPerWeek: { type: Number, default: 40 },
  allowOvertime: { type: Boolean, default: true },
  maxOvertimeHours: { type: Number, default: 10 },
  breakAfterHours: { type: Number, default: 6 },
  breakDurationMinutes: { type: Number, default: 30 }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
