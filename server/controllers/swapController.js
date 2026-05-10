const SwapRequest = require('../models/SwapRequest');
const Schedule = require('../models/Schedule');

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
    // Ovdje bi išla notifikacija (email/push)
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
