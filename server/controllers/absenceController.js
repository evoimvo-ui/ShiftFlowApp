const Absence = require('../models/Absence');
const Worker = require('../models/Worker');
const Schedule = require('../models/Schedule');
const ShiftType = require('../models/ShiftType');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { shiftDurationHours } = require('../utils/scheduler');

// Pomoćna funkcija za datume (bezbedna za vremenske zone)
const isoDate = (date) => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
  const d = new Date(date);
  return d.getUTCFullYear() + '-' + 
         String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + 
         String(d.getUTCDate()).padStart(2, '0');
};

const addDays = (date, n) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

const removeWorkerFromSchedules = async (workerId, startDate, endDate, organizationId) => {
  const workerIdStr = workerId.toString();
  const startIso = isoDate(startDate);
  const endIso = isoDate(endDate);
  
  const schedules = await Schedule.find({ organizationId });
  const shifts = await ShiftType.find({ organizationId });

  for (const schedule of schedules) {
    let changed = false;
    
    // Filtriramo assignments
    const filteredAssignments = schedule.assignments.filter(assignment => {
      if (!assignment.workerId) return true;

      const assignmentDate = isoDate(addDays(schedule.weekStart, assignment.dayOffset));
      const isTargetWorker = assignment.workerId.toString() === workerIdStr;
      const isInDateRange = assignmentDate >= startIso && assignmentDate <= endIso;

      if (isTargetWorker && isInDateRange) {
        changed = true;
        // Ažuriraj sate radnika u mapi
        const shift = shifts.find(s => s.id === assignment.shiftId || s._id.toString() === assignment.shiftId);
        if (shift && schedule.workerHours) {
          const dur = shiftDurationHours(shift);
          if (schedule.workerHours.has(workerIdStr)) {
            const currentHours = schedule.workerHours.get(workerIdStr);
            schedule.workerHours.set(workerIdStr, Math.max(0, currentHours - dur));
          }
        }
        return false; // Ukloni ovaj assignment
      }
      return true; // Zadrži
    });

    if (changed) {
      schedule.assignments = filteredAssignments;
      schedule.markModified('assignments');
      schedule.markModified('workerHours');
      await schedule.save();
    }
  }
};

exports.getAbsences = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.json([]);
    
    let query = { organizationId: orgId };
    
    // Ako je radnik, dodatno filtriraj samo njegove odsutnosti
    if (req.user.role === 'worker') {
      const worker = await Worker.findOne({ 
        name: new RegExp(req.user.username, 'i'),
        organizationId: orgId 
      });
      if (worker) {
        query.workerId = worker._id;
      } else {
        return res.json([]);
      }
    }

    const absences = await Absence.find(query).populate('workerId');
    res.json(absences);
  } catch (err) {
    console.error('GetAbsences Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createAbsence = async (req, res) => {
  try {
    const absenceData = { ...req.body, organizationId: req.user.organizationId };
    
    if (req.user.role === 'worker') {
      const worker = await Worker.findOne({ 
        name: new RegExp(req.user.username, 'i'),
        organizationId: req.user.organizationId
      });
      if (!worker) {
        return res.status(400).json({ message: 'Radnik nije pronađen za vaš nalog.' });
      }
      absenceData.workerId = worker._id;
      absenceData.status = 'pending';
    } else {
      absenceData.status = absenceData.status || 'approved';
    }
    
    const absence = new Absence(absenceData);
    await absence.save();
    
    // Kreiraj notifikaciju za admin ako je status pending
    if (absence.status === 'pending') {
      const worker = await Worker.findById(absence.workerId);
      if (worker) {
        // Pronađi sve admin korisnike
        const adminUsers = await User.find({ role: 'admin' });
        
        for (const adminUser of adminUsers) {
          const notification = new Notification({
            recipientId: adminUser._id,
            type: 'absence_request',
            relatedId: absence._id,
            title: 'Zahtev za odsutnost',
            message: `${worker.name} traži dozvolu za odsutnost od ${absence.startDate} do ${absence.endDate}.`,
            status: 'unread'
          });
          await notification.save();
        }
      }
    }
    
    if (absence.status === 'approved') {
      await removeWorkerFromSchedules(absence.workerId, absence.startDate, absence.endDate, req.user.organizationId);
    }

    res.status(201).json(absence);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.approveAbsence = async (req, res) => {
  try {
    const { status } = req.body;
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Samo admin može odobriti odsutnost' });
    
    const absence = await Absence.findById(req.params.id);
    if (!absence) return res.status(404).json({ message: 'Odsutnost nije pronađena' });
    
    const oldStatus = absence.status;
    absence.status = status;
    const updatedAbsence = await absence.save();

    // Ako je odsutnost odobrena, ažuriraj rasporede (ukloni radnika iz smjena u tom periodu)
    if (status === 'approved' && oldStatus !== 'approved') {
      await removeWorkerFromSchedules(updatedAbsence.workerId, updatedAbsence.startDate, updatedAbsence.endDate);
    }
    
    res.json(updatedAbsence);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.deleteAbsence = async (req, res) => {
  try {
    await Absence.findByIdAndDelete(req.params.id);
    res.json({ message: 'Odsutnost obrisana' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
