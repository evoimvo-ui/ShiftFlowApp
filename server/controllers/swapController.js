const SwapRequest = require('../models/SwapRequest');
const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');
const Worker = require('../models/Worker');

exports.getSwapRequests = async (req, res) => {
  try {
    const swaps = await SwapRequest.find()
      .populate('requestingWorkerId', 'name')
      .populate('targetWorkerId', 'name')
      .sort({ requestedAt: -1 });
    res.json(swaps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSwapRequest = async (req, res) => {
  try {
    const swap = new SwapRequest(req.body);
    await swap.save();
    
    // Kreiraj notifikaciju za targetWorkerId
    const requestingWorker = await Worker.findById(swap.requestingWorkerId);
    const targetWorker = await Worker.findById(swap.targetWorkerId);
    
    if (requestingWorker && targetWorker) {
      const notification = new Notification({
        recipientId: swap.targetWorkerId,
        type: 'swap_request',
        relatedId: swap._id,
        title: 'Zahtev za zamjenu smjene',
        message: `${requestingWorker.name} traži da zameni smjenu sa vama.`,
        status: 'unread'
      });
      await notification.save();
    }
    
    res.status(201).json(swap);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.processSwapRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Zahtjev nije pronađen' });

    swap.status = status;
    swap.processedAt = Date.now();
    await swap.save();

    // Ako je targetWorkerId prihvatio, kreiraj notifikaciju za admin
    if (status === 'accepted_by_worker') {
      const requestingWorker = await Worker.findById(swap.requestingWorkerId);
      const targetWorker = await Worker.findById(swap.targetWorkerId);
      
      if (requestingWorker && targetWorker) {
        // Pronađi sve admin korisnike
        const User = require('../models/User');
        const adminUsers = await User.find({ role: 'admin' });
        
        for (const adminUser of adminUsers) {
          const notification = new Notification({
            recipientId: adminUser._id,
            type: 'swap_approval',
            relatedId: swap._id,
            title: 'Zahtev za zamjenu smjene za odobravanje',
            message: `${targetWorker.name} je prihvatio/la zahtev za zamjenu smjene od ${requestingWorker.name}. Potrebna je administratorska odobrenja.`,
            status: 'unread'
          });
          await notification.save();
        }
      }
    }

    if (status === 'approved') {
      const schedule = await Schedule.findById(swap.scheduleId);
      if (schedule) {
        // Zamijeni radnike u assignments
        const a1 = schedule.assignments.find(a => a._id.toString() === swap.originalAssignmentId);
        const a2 = schedule.assignments.find(a => a._id.toString() === swap.targetAssignmentId);
        
        if (a1 && a2) {
          const tempWorker = a1.workerId;
          a1.workerId = a2.workerId;
          a2.workerId = tempWorker;
          await schedule.save();
        }
      }
    }

    res.json(swap);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
