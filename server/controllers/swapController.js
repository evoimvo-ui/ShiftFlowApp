const SwapRequest = require('../models/SwapRequest');
const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');
const Worker = require('../models/Worker');
const { sendPushToUser } = require('../utils/pushService');

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
      
      // Pošalji push notifikaciju
      try {
        await sendPushToUser(swap.targetWorkerId, 'Zahtev za zamjenu smjene', `${requestingWorker.name} traži da zameni smjenu sa vama.`);
      } catch (pushErr) {
        console.error('Push notification error:', pushErr);
      }
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
            message: `${targetWorker.name} je prihvatio/la zahtev za zamjenu smjene od ${requestingWorker.name}. Potrebna je administratorska odobrenja.',
            status: 'unread'
          });
          await notification.save();
        }
        
        // Pošalji push notifikacije svim adminima
        try {
          for (const adminUser of adminUsers) {
            await sendPushToUser(adminUser._id, 'Zahtev za zamjenu smjene za odobravanje', `${targetWorker.name} je prihvatio/la zahtev za zamjenu smjene od ${requestingWorker.name}.`);
          }
        } catch (pushErr) {
          console.error('Push notification error:', pushErr);
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
      
      // Pošalji notifikacije radnicima da je zamjena odobrena
      try {
        const reqWorker = await Worker.findById(swap.requestingWorkerId);
        const tgtWorker = await Worker.findById(swap.targetWorkerId);
        
        if (reqWorker) {
          const notificationReq = new Notification({
            recipientId: swap.requestingWorkerId,
            type: 'swap_response',
            relatedId: swap._id,
            title: 'Zamjena smjene odobrena',
            message: 'Vaša zamjena smjene je odobrena.',
            status: 'unread'
          });
          await notificationReq.save();
          await sendPushToUser(swap.requestingWorkerId, 'Zamjena smjene odobrena', 'Vaša zamjena smjene je odobrena.');
        }
        
        if (tgtWorker) {
          const notificationTgt = new Notification({
            recipientId: swap.targetWorkerId,
            type: 'swap_response',
            relatedId: swap._id,
            title: 'Zamjena smjene odobrena',
            message: 'Vaša zamjena smjene je odobrena.',
            status: 'unread'
          });
          await notificationTgt.save();
          await sendPushToUser(swap.targetWorkerId, 'Zamjena smjene odobrena', 'Vaša zamjena smjene je odobrena.');
        }
      } catch (pushErr) {
        console.error('Push notification error:', pushErr);
      }
    } else if (status === 'rejected') {
      // Pošalji notifikacije radnicima da je zamjena odbijena
      try {
        const reqWorker = await Worker.findById(swap.requestingWorkerId);
        const tgtWorker = await Worker.findById(swap.targetWorkerId);
        
        if (reqWorker) {
          const notificationReq = new Notification({
            recipientId: swap.requestingWorkerId,
            type: 'swap_response',
            relatedId: swap._id,
            title: 'Zamjena smjene odbijena',
            message: 'Vaša zamjena smjene je odbijena.',
            status: 'unread'
          });
          await notificationReq.save();
          await sendPushToUser(swap.requestingWorkerId, 'Zamjena smjene odbijena', 'Vaša zamjena smjene je odbijena.');
        }
        
        if (tgtWorker) {
          const notificationTgt = new Notification({
            recipientId: swap.targetWorkerId,
            type: 'swap_response',
            relatedId: swap._id,
            title: 'Zamjena smjene odbijena',
            message: 'Zamjena smjene je odbijena.',
            status: 'unread'
          });
          await notificationTgt.save();
          await sendPushToUser(swap.targetWorkerId, 'Zamjena smjene odbijena', 'Zamjena smjene je odbijena.');
        }
      } catch (pushErr) {
        console.error('Push notification error:', pushErr);
      }
    }

    res.json(swap);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
