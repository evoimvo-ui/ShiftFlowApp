const Worker = require('../models/Worker');
const User = require('../models/User');
const Organization = require('../models/Organization');
const PLAN_FEATURES = require('../config/planFeatures');
const { generateTemporaryPassword } = require('../utils/passwordGenerator');

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
    const orgId = req.user.organizationId;

    // Provjera plan limita
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organizacija nije pronađena' });
    }
    const plan = org.settings?.subscriptionPlan || 'basic';
    const status = org.settings?.subscriptionStatus || 'trial';

    if (status === 'trial' || status === 'active') {
      const currentWorkersCount = await Worker.countDocuments({ organizationId: orgId });
      const maxWorkers = PLAN_FEATURES[plan].maxWorkers;
      if (currentWorkersCount >= maxWorkers) {
        return res.status(403).json({ error: 'worker_limit_reached', limit: maxWorkers });
      }
    }

    if (data.categoryIds) {
      data.categoryIds = [...new Set(data.categoryIds.map(id => String(id)))];
    }
    
    // 1. Kreiraj Worker dokument
    const workerData = { ...data, organizationId: orgId };
    const worker = new Worker(workerData);
    await worker.save();

    // 2. Automatski kreiraj User nalog za radnika
    const tempPassword = generateTemporaryPassword();
    const newUser = new User({
      username: worker.name, // Koristimo ime i prezime kao username
      password: tempPassword,
      role: 'worker',
      organizationId: orgId,
      mustChangePassword: true
    });
    await newUser.save();

    // 3. Poveži Worker dokument sa User nalogom
    worker.username = worker.name;
    await worker.save();

    const populated = await Worker.findById(worker._id).populate('categoryIds');
    
    // Vrati radnika i lozinku (lozinka se šalje samo sada)
    res.status(201).json({
      ...populated.toObject(),
      generatedPassword: tempPassword
    });
  } catch (err) {
    console.error('CreateWorker Error:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.categoryIds) {
      data.categoryIds = [...new Set(data.categoryIds.map(id => String(id)))];
    }
    const updatedWorker = await Worker.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      data,
      { new: true }
    ).populate('categoryIds');
    
    if (!updatedWorker) {
      return res.status(404).json({ message: 'Radnik nije pronađen ili nemate pristup.' });
    }
    res.json(updatedWorker);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    const deleted = await Worker.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!deleted) {
      return res.status(404).json({ message: 'Radnik nije pronađen ili nemate pristup.' });
    }
    res.json({ message: 'Radnik obrisan' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
