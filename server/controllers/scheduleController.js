const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Worker = require('../models/Worker');
const Category = require('../models/Category');
const Absence = require('../models/Absence');
const Holiday = require('../models/Holiday');
const AuditLog = require('../models/AuditLog');
const { generateSchedule, isWorkerAbsent, isoDate, addDays } = require('../utils/scheduler');

exports.getSchedules = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.json([]);
    const schedules = await Schedule.find({ organizationId: orgId });
    res.json(schedules);
  } catch (err) {
    console.error('GetSchedules Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.generateNewSchedule = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { weekStart, shiftTypes, settings } = req.body;
    const organizationId = req.user.organizationId;
    
    // Provjeri da li već postoji raspored za tu sedmicu i obriši ga ako postoji
    await Schedule.findOneAndDelete({ weekStart, organizationId }, { session });

    const workers = await Worker.find({ organizationId }).session(session);
    const categories = await Category.find({ organizationId }).session(session);
    const absences = await Absence.find({ organizationId }).session(session);
    const holidays = await Holiday.find({ organizationId }).session(session);
    const historicalSchedules = await Schedule.find({ organizationId }).sort({ weekStart: -1 }).limit(8).session(session);

    const newScheduleData = generateSchedule(
      weekStart,
      workers,
      categories,
      absences,
      shiftTypes,
      settings,
      historicalSchedules,
      holidays
    );

    const schedule = new Schedule({
      organizationId,
      weekStart,
      assignments: newScheduleData.assignments,
      workerHours: newScheduleData.workerHours,
      status: 'draft'
    });
    await schedule.save({ session });

    await session.commitTransaction();
    res.status(201).json(schedule);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    await Schedule.findOneAndDelete({ 
      weekStart: req.params.weekStart, 
      organizationId: req.user.organizationId 
    });
    res.json({ message: 'Raspored obrisan' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.manualUpdate = async (req, res) => {
  try {
    const { scheduleId, assignmentId, newWorkerId, reason, dayOffset, shiftId, categoryId } = req.body;
    const schedule = await Schedule.findOne({ _id: scheduleId, organizationId: req.user.organizationId });
    if (!schedule) return res.status(404).json({ message: 'Raspored nije pronađen ili nemate pristup.' });

    let oldWorkerId = null;
    let assignment = null;
    let finalShiftId = shiftId;
    let finalCategoryId = categoryId;
    let finalDayOffset = dayOffset;

    if (assignmentId) {
      assignment = schedule.assignments.id(assignmentId);
      if (assignment) {
        oldWorkerId = assignment.workerId;
        finalShiftId = assignment.shiftId;
        finalCategoryId = assignment.categoryId;
        finalDayOffset = assignment.dayOffset;
      }
    }

    // 1. PROVJERA BOLOVANJA: Da li je radnik na bolovanju taj dan?
    if (newWorkerId) {
      const absences = await Absence.find({ organizationId: schedule.organizationId });
      const shiftDate = addDays(schedule.weekStart, finalDayOffset);
      
      if (isWorkerAbsent(newWorkerId, shiftDate, absences)) {
        return res.status(400).json({ message: 'Ovaj radnik je na odobrenom bolovanju/odsustvu na ovaj dan.' });
      }

      // 2. PROVJERA DUPLIKATA: Da li je radnik već dodijeljen bilo kojoj smjeni u ovom danu?
      const existingInDay = schedule.assignments.find(a => 
        !a.isWarning && 
        a.dayOffset === finalDayOffset && 
        String(a.workerId) === String(newWorkerId) &&
        String(a._id) !== String(assignmentId)
      );

      if (existingInDay) {
        return res.status(400).json({ message: 'Radnik je već dodijeljen drugoj smjeni u ovom danu.' });
      }
    }

    if (assignmentId) {
      if (assignment) {
        assignment.workerId = newWorkerId;
      }
    } else if (finalDayOffset !== undefined && finalShiftId && finalCategoryId) {
      const newAssignment = {
        workerId: newWorkerId,
        shiftId: finalShiftId,
        categoryId: finalCategoryId,
        dayOffset: finalDayOffset,
        isWarning: false
      };
      schedule.assignments.push(newAssignment);
      
      const warning = schedule.assignments.find(a => 
        a.isWarning && 
        a.dayOffset === finalDayOffset && 
        a.shiftId === finalShiftId && 
        String(a.categoryId) === String(finalCategoryId)
      );
      
      if (warning) {
        warning.needed -= 1;
        if (warning.needed <= 0) {
          schedule.assignments.pull(warning._id);
        }
      }
    }

    // Ažuriranje radnih sati (workerHours)
    const ShiftType = require('../models/ShiftType');
    const shifts = await ShiftType.find({ organizationId: schedule.organizationId });
    const { shiftDurationHours } = require('../utils/scheduler');
    
    const shift = shifts.find(s => s.id === finalShiftId || String(s._id) === String(finalShiftId));
    
    if (shift) {
      const dur = shiftDurationHours(shift);
      if (!schedule.workerHours) schedule.workerHours = new Map();
      
      // Smanji sate starom radniku
      if (oldWorkerId) {
        const oldId = String(oldWorkerId);
        const current = schedule.workerHours.get(oldId) || 0;
        schedule.workerHours.set(oldId, Math.max(0, current - dur));
      }
      
      // Povećaj sate novom radniku
      if (newWorkerId) {
        const newId = String(newWorkerId);
        const current = schedule.workerHours.get(newId) || 0;
        schedule.workerHours.set(newId, current + dur);
      }
    }

    schedule.markModified('assignments');
    schedule.markModified('workerHours');
    await schedule.save();

    const log = new AuditLog({
      adminId: req.user.id,
      organizationId: schedule.organizationId,
      action: 'MANUAL_SHIFT_CHANGE',
      details: {
        scheduleId,
        assignmentId,
        oldWorkerId,
        newWorkerId,
        date: schedule.weekStart,
        dayOffset: finalDayOffset
      },
      reason: reason || 'Ručna izmjena'
    });
    await log.save();

    res.json(schedule);
  } catch (err) {
    console.error('ManualUpdate Error:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const { scheduleId, assignmentId } = req.params;
    const schedule = await Schedule.findOne({ _id: scheduleId, organizationId: req.user.organizationId });
    if (!schedule) return res.status(404).json({ message: 'Raspored nije pronađen ili nemate pristup.' });

    const assignment = schedule.assignments.id(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Smjena nije pronađena' });

    const workerId = assignment.workerId;
    const shiftId = assignment.shiftId;
    const dayOffset = assignment.dayOffset;

    // Ažuriranje radnih sati (workerHours)
    const ShiftType = require('../models/ShiftType');
    const shift = await ShiftType.findOne({ 
      $or: [{ id: shiftId }, { _id: mongoose.Types.ObjectId.isValid(shiftId) ? shiftId : null }],
      organizationId: schedule.organizationId 
    });

    if (shift && workerId && schedule.workerHours) {
      const { shiftDurationHours } = require('../utils/scheduler');
      const dur = shiftDurationHours(shift);
      const wId = String(workerId);
      const current = schedule.workerHours.get(wId) || 0;
      schedule.workerHours.set(wId, Math.max(0, current - dur));
    }

    // Ukloni assignment
    schedule.assignments.pull(assignmentId);
    
    // Provjeri da li treba dodati warning nazad (ako je kategorija zahtijevala radnika)
    // Ovdje bismo mogli dodati logiku za vraćanje warning-a, ali za početak ćemo samo obrisati
    // jer korisnik ručno briše duplikat.
    
    schedule.markModified('assignments');
    schedule.markModified('workerHours');
    await schedule.save();

    // Log the change
    const log = new AuditLog({
      adminId: req.user.id,
      organizationId: schedule.organizationId,
      action: 'MANUAL_SHIFT_DELETE',
      details: {
        scheduleId,
        assignmentId,
        workerId,
        date: schedule.weekStart,
        dayOffset
      },
      reason: 'Ručno brisanje smjene'
    });
    await log.save();

    res.json(schedule);
  } catch (err) {
    console.error('DeleteAssignment Error:', err);
    res.status(400).json({ message: err.message });
  }
};

