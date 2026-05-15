const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
  minRestHours: { type: Number, default: 11 },
  maxHoursPerWeek: { type: Number, default: 40 },
  allowOvertime: { type: Boolean, default: true },
  maxOvertimeHours: { type: Number, default: 10 },
  breakAfterHours: { type: Number, default: 6 },
  breakDurationMinutes: { type: Number, default: 30 },
  schedulingStrategy: { type: String, enum: ['fixed', 'accumulation'], default: 'fixed' },
  weekendRotationEnabled: { type: Boolean, default: false },
  weekendCycleWeeks: { type: Number, default: 3 } // Podrazumijevano 2 slobodna, 1 radni
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
