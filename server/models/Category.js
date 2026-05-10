const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  color: { type: String, default: '#3b82f6' },
  requiredPerShift: {
    type: Map,
    of: Number
  },
  useWeekendWeights: { type: Boolean, default: false },
  requiredPerShiftWeekend: {
    type: Map,
    of: Number
  },
  useHolidayWeights: { type: Boolean, default: false },
  requiredPerShiftHoliday: {
    type: Map,
    of: Number
  }
});

module.exports = mongoose.model('Category', categorySchema);
