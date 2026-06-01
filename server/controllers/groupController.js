const Group = require('../models/Group');

exports.getGroups = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) return res.json([]);
    const groups = await Group.find({ organizationId: orgId });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const group = new Group({
      ...req.body,
      organizationId: req.user.organizationId
    });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true }
    );
    if (!group) return res.status(404).json({ message: 'Grupa nije pronađena' });
    res.json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findOneAndDelete({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId 
    });
    if (!group) return res.status(404).json({ message: 'Grupa nije pronađena' });
    
    // Ovdje bi mogli dodati logiku za prebacivanje radnika u podrazumijevanu grupu
    // ali za sada samo brišemo grupu.
    
    res.json({ message: 'Grupa uspješno obrisana' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
