const Notification = require('../models/Notification');
const SwapRequest = require('../models/SwapRequest');
const Absence = require('../models/Absence');
const Schedule = require('../models/Schedule');

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId je obavezan' });
    
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notifikacija nije pronađena' });
    
    notification.status = 'read';
    notification.readAt = Date.now();
    await notification.save();
    
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.processNotification = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' ili 'reject'
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) return res.status(404).json({ message: 'Notifikacija nije pronađena' });
    
    notification.status = 'actioned';
    notification.actionedAt = Date.now();
    await notification.save();
    
    // Obradi notifikaciju na osnovu tipa
    if (notification.type === 'swap_request') {
      // Radnik prihvata/odbija zahtev za zamjenu
      await processSwapRequest(notification.relatedId, action, notification.recipientId);
    } else if (notification.type === 'swap_approval') {
      // Admin odobrava/odbija zahtev za zamjenu
      await processSwapApproval(notification.relatedId, action);
    } else if (notification.type === 'absence_request') {
      // Admin odobrava/odbija zahtev za odsutnost
      await processAbsenceRequest(notification.relatedId, action);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function processSwapRequest(swapRequestId, action, workerId) {
  const swap = await SwapRequest.findById(swapRequestId);
  if (!swap) return;
  
  const status = action === 'approve' ? 'accepted_by_worker' : 'rejected';
  swap.status = status;
  swap.processedAt = Date.now();
  await swap.save();
  
  // Notifikacija za requestingWorkerId da je zahtev prihvaćen/odbijen
  const Worker = require('../models/Worker');
  const requestingWorker = await Worker.findById(swap.requestingWorkerId);
  const targetWorker = await Worker.findById(swap.targetWorkerId);
  
  if (requestingWorker && targetWorker) {
    const title = action === 'approve' ? 'Zamjena smjene prihvaćena' : 'Zamjena smjene odbijena';
    const message = action === 'approve' 
      ? `${targetWorker.name} je prihvatio/la vaš zahtev za zamjenu smjene.`
      : `${targetWorker.name} je odbio/la vaš zahtev za zamjenu smjene.`;
    
    const responseNotification = new Notification({
      recipientId: swap.requestingWorkerId,
      type: 'swap_response',
      relatedId: swapRequestId,
      title,
      message,
      status: 'unread'
    });
    await responseNotification.save();
  }
}

async function processSwapApproval(swapRequestId, action) {
  const swap = await SwapRequest.findById(swapRequestId);
  if (!swap) return;
  
  const status = action === 'approve' ? 'approved' : 'rejected';
  swap.status = status;
  swap.processedAt = Date.now();
  await swap.save();
  
  if (status === 'approved') {
    const schedule = await Schedule.findById(swap.scheduleId);
    if (schedule) {
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
  
  // Notifikacija za requestingWorkerId da je admin odobrio/odbio zahtev
  const Worker = require('../models/Worker');
  const requestingWorker = await Worker.findById(swap.requestingWorkerId);
  if (requestingWorker) {
    const title = action === 'approve' ? 'Zamjena smjene odobrena' : 'Zamjena smjene odbijena';
    const message = action === 'approve' 
      ? 'Administrator je odobrio vaš zahtev za zamjenu smjene. Raspored je ažuriran.'
      : 'Administrator je odbio vaš zahtev za zamjenu smjene.';
    
    const responseNotification = new Notification({
      recipientId: swap.requestingWorkerId,
      type: 'swap_response',
      relatedId: swapRequestId,
      title,
      message,
      status: 'unread'
    });
    await responseNotification.save();
  }
}

async function processAbsenceRequest(absenceId, action) {
  const absence = await Absence.findById(absenceId);
  if (!absence) return;
  
  const status = action === 'approve' ? 'approved' : 'rejected';
  absence.status = status;
  await absence.save();
  
  // Notifikacija za workerId da je admin odobrio/odbio zahtev
  const Worker = require('../models/Worker');
  const worker = await Worker.findById(absence.workerId);
  if (worker) {
    const title = action === 'approve' ? 'Odsutnost odobrena' : 'Odsutnost odbijena';
    const message = action === 'approve' 
      ? 'Administrator je odobrio vaš zahtev za odsutnost.'
      : 'Administrator je odbio vaš zahtev za odsutnost.';
    
    const responseNotification = new Notification({
      recipientId: absence.workerId,
      type: 'absence_response',
      relatedId: absenceId,
      title,
      message,
      status: 'unread'
    });
    await responseNotification.save();
  }
}
