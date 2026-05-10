const mongoose = require('mongoose');

const absenceSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  type: { type: String, enum: ['sick', 'vacation', 'business', 'other'], default: 'sick' },
  startDate: { type: String, required: true }, // ISO Date YYYY-MM-DD
  endDate: { type: String, required: true }, // ISO Date YYYY-MM-DD
  note: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' } // Adminove su odmah approved, radničke pending
}, { timestamps: true });

module.exports = mongoose.model('Absence', absenceSchema);
