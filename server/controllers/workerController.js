const Worker = require('../models/Worker');

exports.getWorkers = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      console.log('GetWorkers: No Organization ID found in token for user:', req.user.username);
      return res.json([]);
    }
    const workers = await Worker.find({ organizationId: orgId }).populate('categoryIds');
    res.json(workers);
  } catch (err) {
    console.error('GetWorkers Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createWorker = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.categoryIds) {
      data.categoryIds = [...new Set(data.categoryIds.map(id => String(id)))];
    }
    const workerData = { ...data, organizationId: req.user.organizationId };
    const worker = new Worker(workerData);
    await worker.save();
    const populated = await Worker.findById(worker._id).populate('categoryIds');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.categoryIds) {
      data.categoryIds = [...new Set(data.categoryIds.map(id => String(id)))];
    }
    const updatedWorker = await Worker.findByIdAndUpdate(req.params.id, data, { new: true }).populate('categoryIds');
    res.json(updatedWorker);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Radnik obrisan' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
