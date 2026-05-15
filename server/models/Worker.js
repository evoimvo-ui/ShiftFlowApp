const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String }, // Povezano korisničko ime
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  phone: String,
  email: String,
  maxHoursPerWeek: { type: Number, default: 40 },
  weekendCycleStart: { type: Date, default: null }, // Datum od kojeg počinje ciklus rotacije
  dayBank: { type: Number, default: 0 }, // Saldo slobodnih dana (npr. +1 ako ima dan viška)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Worker', workerSchema);
