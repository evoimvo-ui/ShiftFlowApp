const uid = () => Math.random().toString(36).slice(2, 9);

function parseTime(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function shiftDurationHours(shift) {
  let s1 = parseTime(shift.start);
  let e1 = parseTime(shift.end);
  if (e1 <= s1) e1 += 24 * 60;
  let dur = (e1 - s1) / 60;

  if (shift.isSplit && shift.start2 && shift.end2) {
    let s2 = parseTime(shift.start2);
    let e2 = parseTime(shift.end2);
    if (e2 <= s2) e2 += 24 * 60;
    dur += (e2 - s2) / 60;
  }
  return dur;
}

function isoDate(date) {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
  const d = new Date(date);
  return d.getUTCFullYear() + '-' + 
         String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + 
         String(d.getUTCDate()).padStart(2, '0');
}

function addDays(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function isWorkerAbsent(workerId, date, absences) {
  const iso = isoDate(date);
  return absences.some(a => {
    const aWorkerId = a.workerId?._id || a.workerId;
    const start = isoDate(a.startDate);
    const end = isoDate(a.endDate);
    return aWorkerId.toString() === workerId.toString() && 
           start <= iso && 
           end >= iso && 
           a.status === 'approved';
  });
}

function isHoliday(date, holidays) {
  const iso = isoDate(date);
  const monthDay = iso.slice(5); // MM-DD
  return holidays.some(h => h.date === iso || (h.isRecurring && h.date.slice(5) === monthDay));
}

function generateSchedule(weekStart, workers, categories, absences, shiftTypes, settings, historicalSchedules, holidays = []) {
  const assignments = [];
  const workerHours = {};
  const workerLastShift = {}; 
  const workerShiftCount = {};

  historicalSchedules.slice(-8).forEach(sched => {
    sched.assignments.forEach(a => {
      if (a.workerId) {
        const wId = a.workerId.toString();
        if (!workerShiftCount[wId]) workerShiftCount[wId] = {};
        workerShiftCount[wId][a.shiftId] = (workerShiftCount[wId][a.shiftId] || 0) + 1;
      }
    });
  });

  const minRest = settings.minRestHours || 11;
  const maxHours = settings.maxHoursPerWeek || 40;
  const sortedShifts = [...shiftTypes].sort((a, b) => parseTime(a.start) - parseTime(b.start));

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayDate = addDays(weekStart, dayOffset);

    for (const shift of sortedShifts) {
      for (const category of categories) {
        let required = 0;
        const isWknd = dayOffset === 5 || dayOffset === 6;
        const isHldy = isHoliday(dayDate, holidays);
        
        let reqField = 'requiredPerShift';
        if (isHldy && category.useHolidayWeights) {
          reqField = 'requiredPerShiftHoliday';
        } else if (isWknd && category.useWeekendWeights) {
          reqField = 'requiredPerShiftWeekend';
        }

        if (category[reqField] instanceof Map) {
          required = category[reqField].get(shift.id) || 0;
        } else if (category[reqField]) {
          required = category[reqField][shift.id] || 0;
        }
        
        if (required === 0) continue;

        const shiftDur = shiftDurationHours(shift);

        const available = workers.filter(w => {
          const wId = w._id.toString();
          const wCats = (w.categoryIds || []).map(id => id.toString());
          if (!wCats.includes(category._id.toString())) return false;
          
          // Strožija provjera odsutnosti
          if (isWorkerAbsent(wId, dayDate, absences)) return false;
          
          const hoursUsed = workerHours[wId] || 0;
          if (hoursUsed + shiftDur > maxHours + (settings.allowOvertime ? settings.maxOvertimeHours || 8 : 0)) return false;
          
          const lastEnd = workerLastShift[wId]; // minutes from week start
          if (lastEnd !== undefined) {
            const currentStart = dayOffset * 24 * 60 + parseTime(shift.start);
            if (currentStart - lastEnd < minRest * 60) return false;
          }
          return true;
        });

        available.sort((a, b) => {
          const aId = a._id.toString();
          const bId = b._id.toString();
          const aHours = workerHours[aId] || 0;
          const bHours = workerHours[bId] || 0;
          const aShiftCount = (workerShiftCount[aId] || {})[shift.id] || 0;
          const bShiftCount = (workerShiftCount[bId] || {})[shift.id] || 0
          return (aHours - bHours) * 2 + (aShiftCount - bShiftCount);
        });

        const toAssign = available.slice(0, required);
        for (const worker of toAssign) {
          const wId = worker._id.toString();
          assignments.push({
            workerId: worker._id,
            categoryId: category._id,
            shiftId: shift.id,
            dayOffset,
          });
          workerHours[wId] = (workerHours[wId] || 0) + shiftDur;
          
          // Izračunaj kraj smjene (za dvokratnu koristimo kraj drugog dijela)
          const actualEnd = (shift.isSplit && shift.end2) ? shift.end2 : shift.end;
          const actualStart = (shift.isSplit && shift.end2) ? shift.start : shift.start; // start prvog dijela

          const endsNextDay = parseTime(actualEnd) <= parseTime(shift.start);
          const endMinutes = dayOffset * 24 * 60 + parseTime(actualEnd) + (endsNextDay ? 24 * 60 : 0);
          workerLastShift[wId] = endMinutes;
          if (!workerShiftCount[wId]) workerShiftCount[wId] = {};
          workerShiftCount[wId][shift.id] = (workerShiftCount[wId][shift.id] || 0) + 1;
        }

        if (toAssign.length < required) {
          assignments.push({
            isWarning: true,
            categoryId: category._id,
            shiftId: shift.id,
            dayOffset,
            needed: required - toAssign.length,
          });
        }
      }
    }
  }

  return { weekStart: isoDate(weekStart), assignments, workerHours };
}

module.exports = {
  generateSchedule,
  parseTime,
  shiftDurationHours
};
