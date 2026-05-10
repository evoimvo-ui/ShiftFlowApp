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
    const workerData = { ...req.body, organizationId: req.user.organizationId };
    const worker = new Worker(workerData);
    await worker.save();
    res.status(201).json(worker);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const updatedWorker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
