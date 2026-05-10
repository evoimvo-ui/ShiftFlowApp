const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  date: { type: String, required: true }, // ISO Date YYYY-MM-DD
  isRecurring: { type: Boolean, default: false } // Svake godine na isti datum
}, { timestamps: true });

module.exports = mongoose.model('Holiday', holidaySchema);
