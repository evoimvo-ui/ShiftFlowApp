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
    const orgId = req.user.organizationId;
    const groupToDelete = await Group.findOne({ 
      _id: req.params.id, 
      organizationId: orgId 
    });
    
    if (!groupToDelete) return res.status(404).json({ message: 'Grupa nije pronađena' });
    
    // Provjeri da li je ovo jedina grupa
    const groupCount = await Group.countDocuments({ organizationId: orgId });
    if (groupCount <= 1) {
      return res.status(400).json({ message: 'Ne možete obrisati jedinu preostalu grupu.' });
    }

    // Pronađi podrazumijevanu grupu (bilo koju drugu grupu)
    const fallbackGroup = await Group.findOne({ 
      _id: { $ne: req.params.id }, 
      organizationId: orgId 
    });

    if (!fallbackGroup) {
      return res.status(400).json({ message: 'Nije pronađena zamjenska grupa za radnike.' });
    }

    // Prebaci radnike
    const Worker = require('../models/Worker');
    await Worker.updateMany(
      { groupId: req.params.id, organizationId: orgId },
      { $set: { groupId: fallbackGroup._id } }
    );

    await Group.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Grupa uspješno obrisana. Radnici su prebačeni u grupu: ' + fallbackGroup.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
