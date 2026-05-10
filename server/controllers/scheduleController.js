const Schedule = require('../models/Schedule');
const Worker = require('../models/Worker');
const Category = require('../models/Category');
const Absence = require('../models/Absence');
const Holiday = require('../models/Holiday');
const AuditLog = require('../models/AuditLog');
const { generateSchedule } = require('../utils/scheduler');

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
  try {
    const { weekStart, shiftTypes, settings } = req.body;
    const organizationId = req.user.organizationId;
    
    const workers = await Worker.find({ organizationId });
    const categories = await Category.find({ organizationId });
    const absences = await Absence.find({ organizationId });
    const holidays = await Holiday.find({ organizationId });
    const historicalSchedules = await Schedule.find({ organizationId }).sort({ weekStart: -1 }).limit(8);

    const newScheduleData = generateSchedule(
      new Date(weekStart),
      workers,
      categories,
      absences,
      shiftTypes,
      settings,
      historicalSchedules,
      holidays
    );

    // Save or update schedule for this week
    let schedule = await Schedule.findOne({ weekStart: newScheduleData.weekStart, organizationId });
    if (schedule) {
      schedule.assignments = newScheduleData.assignments;
      schedule.workerHours = newScheduleData.workerHours;
      await schedule.save();
    } else {
      schedule = new Schedule({ ...newScheduleData, organizationId });
      await schedule.save();
    }

    res.status(201).json(schedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
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
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Raspored nije pronađen' });

    let oldWorkerId = null;
    let assignment = null;

    if (assignmentId) {
      assignment = schedule.assignments.id(assignmentId);
      if (assignment) {
        oldWorkerId = assignment.workerId;
        assignment.workerId = newWorkerId;
      }
    } else if (dayOffset !== undefined && shiftId && categoryId) {
      // Ako nema assignmentId, radi se o popunjavanju "rupe" (warning-a)
      // Kreiramo novi assignment
      const newAssignment = {
        workerId: newWorkerId,
        shiftId: shiftId,
        categoryId: categoryId,
        dayOffset: dayOffset,
        isWarning: false
      };
      schedule.assignments.push(newAssignment);
      
      // Pokušavamo smanjiti broj potrebnih radnika u warning-u za taj dan/smjenu
      const warning = schedule.assignments.find(a => 
        a.isWarning && 
        a.dayOffset === dayOffset && 
        a.shiftId === shiftId && 
        a.categoryId.toString() === categoryId.toString()
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
    const shifts = await ShiftType.find();
    const { shiftDurationHours } = require('../utils/scheduler');
    
    const targetShiftId = assignment ? assignment.shiftId : shiftId;
    const shift = shifts.find(s => s.id === targetShiftId || s._id.toString() === targetShiftId);
    
    if (shift && schedule.workerHours) {
      const dur = shiftDurationHours(shift);
      
      // Smanji sate starom radniku ako postoji
      if (oldWorkerId) {
        const oldWIdStr = oldWorkerId.toString();
        if (schedule.workerHours.has(oldWIdStr)) {
          schedule.workerHours.set(oldWIdStr, Math.max(0, schedule.workerHours.get(oldWIdStr) - dur));
        }
      }
      
      // Povećaj sate novom radniku
      if (newWorkerId) {
        const newWIdStr = newWorkerId.toString();
        const currentHours = schedule.workerHours.get(newWIdStr) || 0;
        schedule.workerHours.set(newWIdStr, currentHours + dur);
      }
    }

    schedule.markModified('assignments');
    schedule.markModified('workerHours');
    await schedule.save();

    // Log the change
    const log = new AuditLog({
      adminId: req.user.id,
      action: 'MANUAL_SHIFT_CHANGE',
      details: {
        scheduleId,
        assignmentId,
        oldWorkerId,
        newWorkerId,
        date: schedule.weekStart,
        dayOffset: assignment ? assignment.dayOffset : dayOffset
      },
      reason: reason || 'Ručno popunjavanje prazne smjene'
    });
    await log.save();

    res.json(schedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

