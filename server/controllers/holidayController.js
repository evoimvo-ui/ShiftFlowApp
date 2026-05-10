const Holiday = require('../models/Holiday');

exports.getHolidays = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.json([]);
    const holidays = await Holiday.find({ organizationId: orgId }).sort({ date: 1 });
    res.json(holidays);
  } catch (err) {
    console.error('GetHolidays Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const holidayData = { ...req.body, organizationId: req.user.organizationId };
    const holiday = new Holiday(holidayData);
    await holiday.save();
    res.status(201).json(holiday);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: 'Praznik obrisan' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
