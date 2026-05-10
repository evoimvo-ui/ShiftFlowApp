import { uid, isoDate, addDays, parseTime, shiftDurationHours, isWorkerAbsent } from './helpers';

export function generateSchedule(weekStart, workers, categories, absences, shiftTypes, settings, historicalSchedules) {
  const assignments = []
  const workerHours = {}
  const workerLastShift = {} // workerId -> { dayOffset, end }
  const workerShiftCount = {} // workerId -> { shiftId -> count }

  // Load historical shift distribution
  historicalSchedules.slice(-8).forEach(sched => {
    sched.assignments.forEach(a => {
      if (!workerShiftCount[a.workerId]) workerShiftCount[a.workerId] = {}
      workerShiftCount[a.workerId][a.shiftId] = (workerShiftCount[a.workerId][a.shiftId] || 0) + 1
    })
  })

  const minRest = settings.minRestHours || 11
  const maxHours = settings.maxHoursPerWeek || 40

  // Sort shifts by start time
  const sortedShifts = [...shiftTypes].sort((a, b) => parseTime(a.start) - parseTime(b.start))

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayDate = addDays(weekStart, dayOffset)

    for (const shift of sortedShifts) {
      for (const category of categories) {
        const required = (category.requiredPerShift || {})[shift.id] || 0
        if (required === 0) continue

        const shiftDur = shiftDurationHours(shift)

        // Get available workers for this category/day/shift
        const available = workers.filter(w => {
          if (w.categoryId !== category.id) return false
          if (isWorkerAbsent(w.id, dayDate, absences)) return false
          // Check weekly hours
          const hoursUsed = workerHours[w.id] || 0
          if (hoursUsed + shiftDur > maxHours + (settings.allowOvertime ? settings.maxOvertimeHours || 8 : 0)) return false
          // Check rest time
          const last = workerLastShift[w.id]
          if (last) {
            const trueRest = last.endsNextDay
              ? (dayOffset - last.dayOffset - 1) * 24 * 60 + parseTime(shift.start) + (24 * 60 - parseTime(last.end))
              : (dayOffset - last.dayOffset) * 24 * 60 + parseTime(shift.start) - parseTime(last.end)
            if (trueRest < minRest * 60) return false
          }
          return true
        })

        // Score and sort for fairness
        available.sort((a, b) => {
          const aHours = workerHours[a.id] || 0
          const bHours = workerHours[b.id] || 0
          const aShiftCount = (workerShiftCount[a.id] || {})[shift.id] || 0
          const bShiftCount = (workerShiftCount[b.id] || {})[shift.id] || 0
          // Prefer fewer hours, then fewer times on this shift
          const score = (aHours - bHours) * 2 + (aShiftCount - bShiftCount)
          return score
        })

        const toAssign = available.slice(0, required)
        for (const worker of toAssign) {
          assignments.push({
            id: uid(),
            workerId: worker.id,
            categoryId: category.id,
            shiftId: shift.id,
            dayOffset,
          })
          workerHours[worker.id] = (workerHours[worker.id] || 0) + shiftDur
          const endsNextDay = parseTime(shift.end) <= parseTime(shift.start)
          workerLastShift[worker.id] = { dayOffset: endsNextDay ? dayOffset + 1 : dayOffset, end: shift.end, endsNextDay }
          if (!workerShiftCount[worker.id]) workerShiftCount[worker.id] = {}
          workerShiftCount[worker.id][shift.id] = (workerShiftCount[worker.id][shift.id] || 0) + 1
        }

        // Check for understaffing
        if (toAssign.length < required) {
          assignments.push({
            id: uid(),
            isWarning: true,
            categoryId: category.id,
            shiftId: shift.id,
            dayOffset,
            needed: required - toAssign.length,
          })
        }
      }
    }
  }

  return { id: uid(), weekStart: isoDate(weekStart), assignments, workerHours }
}
