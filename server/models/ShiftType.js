const mongoose = require('mongoose');

const shiftTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  start: { type: String, required: true }, // HH:mm
  end: { type: String, required: true },   // HH:mm
  isSplit: { type: Boolean, default: false },
  start2: { type: String }, // Opcionalno za dvokratnu
  end2: { type: String },   // Opcionalno za dvokratnu
  color: { type: String, default: '#3b82f6' },
  icon: { type: String, default: 'sun' }
}, { timestamps: true });

module.exports = mongoose.model('ShiftType', shiftTypeSchema);
