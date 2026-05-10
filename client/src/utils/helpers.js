export const uid = () => Math.random().toString(36).slice(2, 9)

export const DAYS_BS = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']
export const DAYS_FULL = ['Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota', 'Nedjelja']
export const MONTHS_BS = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar']

export function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function formatDate(date) {
  const d = new Date(date)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

export function isoDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseTime(t) { // "HH:MM" -> minutes from midnight
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function shiftDurationHours(shift) {
  let s1 = parseTime(shift.start)
  let e1 = parseTime(shift.end)
  if (e1 <= s1) e1 += 24 * 60
  let dur = (e1 - s1) / 60

  if (shift.isSplit && shift.start2 && shift.end2) {
    let s2 = parseTime(shift.start2)
    let e2 = parseTime(shift.end2)
    if (e2 <= s2) e2 += 24 * 60
    dur += (e2 - s2) / 60
  }
  return dur
}

export function isWorkerAbsent(workerId, date, absences) {
  const iso = isoDate(date)
  const wIdStr = String(workerId?._id || workerId)
  return absences.some(a => {
    const aWIdStr = String(a.workerId?._id || a.workerId)
    return aWIdStr === wIdStr && a.startDate <= iso && a.endDate >= iso && a.status === 'approved'
  })
}

export function getAbsenceOnDay(workerId, date, absences) {
  const iso = isoDate(date)
  const wIdStr = String(workerId?._id || workerId)
  return absences.find(a => {
    const aWIdStr = String(a.workerId?._id || a.workerId)
    return aWIdStr === wIdStr && a.startDate <= iso && a.endDate >= iso && a.status === 'approved'
  })
}

export function hasRestTime(lastShift, currentShift, minRestHours) {
  if (!lastShift) return true
  const lastEnd = parseTime(lastShift.end) + (parseTime(lastShift.end) <= parseTime(lastShift.start) ? 24 * 60 : 0)
  const currentStart = parseTime(currentShift.start) + lastShift.dayOffset * 24 * 60 + currentShift.dayOffset * 24 * 60
  const corrected = parseTime(lastShift.end) > parseTime(currentShift.start) + (currentShift.dayOffset - lastShift.dayOffset) * 24 * 60
    ? (currentShift.dayOffset - lastShift.dayOffset) * 24 * 60 + parseTime(currentShift.start) + 24 * 60 - parseTime(lastShift.end)
    : (currentShift.dayOffset - lastShift.dayOffset) * 24 * 60 + parseTime(currentShift.start) - parseTime(lastShift.end)
  return corrected >= minRestHours * 60
}

export const DEFAULT_SHIFTS = [
  { id: 'morning', name: 'Jutarnja', start: '06:00', end: '14:00', color: '#f59e0b', icon: 'sun' },
  { id: 'afternoon', name: 'Popodnevna', start: '14:00', end: '22:00', color: '#3b82f6', icon: 'sunset' },
  { id: 'night', name: 'Noćna', start: '22:00', end: '06:00', color: '#8b5cf6', icon: 'moon' },
]

export const DEFAULT_SETTINGS = {
  minRestHours: 11,
  maxHoursPerWeek: 40,
  allowOvertime: true,
  maxOvertimeHours: 8,
  breakAfterHours: 6,
  breakDurationMinutes: 30,
}

export const ABSENCE_TYPES = [
  { id: 'sick', label: 'Bolovanje', color: '#f43f5e', icon: 'heart' },
  { id: 'vacation', label: 'Godišnji odmor', color: '#10b981', icon: 'plane' },
  { id: 'business', label: 'Službeni put', color: '#06b6d4', icon: 'briefcase' },
  { id: 'other', label: 'Ostalo', color: '#8899b4', icon: 'help' },
]

export const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#ec4899', '#14b8a6']
