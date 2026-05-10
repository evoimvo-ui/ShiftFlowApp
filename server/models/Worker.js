const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  phone: String,
  email: String,
  maxHoursPerWeek: { type: Number, default: 40 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Worker', workerSchema);
