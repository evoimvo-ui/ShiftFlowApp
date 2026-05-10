const Setting = require('../models/Setting');
const ShiftType = require('../models/ShiftType');

exports.getSettings = async (req, res) => {
  try {
    if (!req.user || !req.user.organizationId) {
      return res.json({});
    }
    let settings = await Setting.findOne({ organizationId: req.user.organizationId });
    if (!settings) {
      settings = await Setting.create({ organizationId: req.user.organizationId });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate(
      { organizationId: req.user.organizationId }, 
      req.body, 
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getShiftTypes = async (req, res) => {
  try {
    const shifts = await ShiftType.find({ organizationId: req.user.organizationId });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createShiftType = async (req, res) => {
  try {
    const shiftData = { ...req.body, organizationId: req.user.organizationId };
    const shift = new ShiftType(shiftData);
    await shift.save();
    res.status(201).json(shift);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateShiftType = async (req, res) => {
  try {
    const shift = await ShiftType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(shift);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteShiftType = async (req, res) => {
  try {
    await ShiftType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Smjena obrisana' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
