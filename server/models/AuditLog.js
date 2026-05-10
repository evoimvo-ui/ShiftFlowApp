const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  action: { type: String, required: true }, // npr. 'MANUAL_SHIFT_CHANGE'
  details: { type: mongoose.Schema.Types.Mixed }, // Detalji o promjeni (stari radnik, novi radnik, datum, smjena)
  reason: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
