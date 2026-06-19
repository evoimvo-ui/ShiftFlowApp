import { uid, isoDate, addDays, getWeekStart } from './helpers';

const today = new Date();
const weekStart = isoDate(getWeekStart(today));

export const MOCK_WORKERS = [
  { _id: 'w1', id: 'w1', name: 'Marko Marković', categoryIds: ['c1'], phone: '061 111 222', email: 'marko@example.com', maxHoursPerWeek: 40, groupId: 'g1' },
  { _id: 'w2', id: 'w2', name: 'Ivan Ivanić', categoryIds: ['c1', 'c2'], phone: '061 333 444', email: 'ivan@example.com', maxHoursPerWeek: 40, groupId: 'g1' },
  { _id: 'w3', id: 'w3', name: 'Petar Petrović', categoryIds: ['c2'], phone: '061 555 666', email: 'petar@example.com', maxHoursPerWeek: 40, groupId: 'g1' },
  { _id: 'w4', id: 'w4', name: 'Sara Sarić', categoryIds: ['c3'], phone: '061 777 888', email: 'sara@example.com', maxHoursPerWeek: 35, groupId: 'g3' },
  { _id: 'w5', id: 'w5', name: 'Ana Anić', categoryIds: ['c1'], phone: '061 999 000', email: 'ana@example.com', maxHoursPerWeek: 40, groupId: 'g1' },
  { _id: 'w6', id: 'w6', name: 'Luka Lukić', categoryIds: ['c4'], phone: '061 222 333', email: 'luka@example.com', maxHoursPerWeek: 40, groupId: 'g2' },
  { _id: 'w7', id: 'w7', name: 'Marija Marić', categoryIds: ['c4', 'c5'], phone: '061 444 555', email: 'marija@example.com', maxHoursPerWeek: 38, groupId: 'g2' },
  { _id: 'w8', id: 'w8', name: 'Nikola Nikolić', categoryIds: ['c2'], phone: '061 666 777', email: 'nikola@example.com', maxHoursPerWeek: 40, groupId: 'g1' },
  { _id: 'w9', id: 'w9', name: 'Jelena Jelić', categoryIds: ['c5'], phone: '061 888 999', email: 'jelena@example.com', maxHoursPerWeek: 35, groupId: 'g3' },
  { _id: 'w10', id: 'w10', name: 'Stefan Stefanović', categoryIds: ['c1', 'c4'], phone: '061 000 111', email: 'stefan@example.com', maxHoursPerWeek: 40, groupId: 'g2' },
  { _id: 'w11', id: 'w11', name: 'Milica Milić', categoryIds: ['c3'], phone: '061 111 223', email: 'milica@example.com', maxHoursPerWeek: 38, groupId: 'g3' },
  { _id: 'w12', id: 'w12', name: 'Vladimir Vladić', categoryIds: ['c2', 'c4'], phone: '061 222 334', email: 'vladimir@example.com', maxHoursPerWeek: 40, groupId: 'g2' },
  { _id: 'w13', id: 'w13', name: 'Tamara Tamarac', categoryIds: ['c1'], phone: '061 333 445', email: 'tamara@example.com', maxHoursPerWeek: 40, groupId: 'g1' },
  { _id: 'w14', id: 'w14', name: 'Boris Borić', categoryIds: ['c5'], phone: '061 444 556', email: 'boris@example.com', maxHoursPerWeek: 38, groupId: 'g3' },
  { _id: 'w15', id: 'w15', name: 'Sandra Sandić', categoryIds: ['c4'], phone: '061 555 667', email: 'sandra@example.com', maxHoursPerWeek: 40, groupId: 'g2' },
];

export const MOCK_CATEGORIES = [
  { _id: 'c1', id: 'c1', name: 'Prodaja', color: '#3b82f6', requiredPerShift: { morning: 2, afternoon: 2, night: 1 } },
  { _id: 'c2', id: 'c2', name: 'Skladište', color: '#10b981', requiredPerShift: { morning: 1, afternoon: 1, night: 1 } },
  { _id: 'c3', id: 'c3', name: 'Administracija', color: '#f59e0b', requiredPerShift: { morning: 1, afternoon: 0, night: 0 } },
  { _id: 'c4', id: 'c4', name: 'Kuhinja', color: '#ef4444', requiredPerShift: { morning: 2, afternoon: 2, night: 1 } },
  { _id: 'c5', id: 'c5', name: 'Recepcija', color: '#8b5cf6', requiredPerShift: { morning: 1, afternoon: 1, night: 1 } },
];

export const MOCK_GROUPS = [
  { _id: 'g1', id: 'g1', name: 'Sektor A', description: 'Radnici na prodaji i skladištu' },
  { _id: 'g2', id: 'g2', name: 'Sektor B', description: 'Radnici u kuhinji i na recepciji' },
  { _id: 'g3', id: 'g3', name: 'Menadžment', description: 'Administrativno osoblje' },
];

export const MOCK_ABSENCES = [
  { _id: 'a1', id: 'a1', workerId: 'w1', type: 'sick', startDate: isoDate(addDays(today, -1)), endDate: isoDate(addDays(today, 2)), note: 'Prehlada', status: 'approved' },
  { _id: 'a2', id: 'a2', workerId: 'w3', type: 'vacation', startDate: isoDate(addDays(today, 5)), endDate: isoDate(addDays(today, 12)), note: 'Godišnji odmor', status: 'pending' },
  { _id: 'a3', id: 'a3', workerId: 'w6', type: 'personal', startDate: isoDate(addDays(today, 2)), endDate: isoDate(addDays(today, 2)), note: 'Lični dan', status: 'approved' },
  { _id: 'a4', id: 'a4', workerId: 'w9', type: 'maternity', startDate: isoDate(addDays(today, 10)), endDate: isoDate(addDays(today, 180)), note: 'Porodiljsko odsustvo', status: 'approved' },
];

export const MOCK_SCHEDULES = [
  {
    _id: 's1',
    id: 's1',
    weekStart: weekStart,
    groupId: null,
    assignments: [
      // Dan 0 (ponedjeljak)
      { id: uid(), workerId: 'w1', categoryId: 'c1', shiftId: 'morning', dayOffset: 0 },
      { id: uid(), workerId: 'w5', categoryId: 'c1', shiftId: 'morning', dayOffset: 0 },
      { id: uid(), workerId: 'w13', categoryId: 'c1', shiftId: 'morning', dayOffset: 0 },
      { id: uid(), workerId: 'w2', categoryId: 'c2', shiftId: 'morning', dayOffset: 0 },
      { id: uid(), workerId: 'w8', categoryId: 'c2', shiftId: 'morning', dayOffset: 0 },
      { id: uid(), workerId: 'w6', categoryId: 'c4', shiftId: 'morning', dayOffset: 0 },
      { id: uid(), workerId: 'w10', categoryId: 'c4', shiftId: 'morning', dayOffset: 0 },
      { id: uid(), workerId: 'w9', categoryId: 'c5', shiftId: 'morning', dayOffset: 0 },
      
      { id: uid(), workerId: 'w2', categoryId: 'c1', shiftId: 'afternoon', dayOffset: 0 },
      { id: uid(), workerId: 'w5', categoryId: 'c1', shiftId: 'afternoon', dayOffset: 0 },
      { id: uid(), workerId: 'w3', categoryId: 'c2', shiftId: 'afternoon', dayOffset: 0 },
      { id: uid(), workerId: 'w8', categoryId: 'c2', shiftId: 'afternoon', dayOffset: 0 },
      { id: uid(), workerId: 'w7', categoryId: 'c4', shiftId: 'afternoon', dayOffset: 0 },
      { id: uid(), workerId: 'w12', categoryId: 'c4', shiftId: 'afternoon', dayOffset: 0 },
      { id: uid(), workerId: 'w14', categoryId: 'c5', shiftId: 'afternoon', dayOffset: 0 },
      
      { id: uid(), workerId: 'w1', categoryId: 'c1', shiftId: 'night', dayOffset: 0 },
      { id: uid(), workerId: 'w3', categoryId: 'c2', shiftId: 'night', dayOffset: 0 },
      { id: uid(), workerId: 'w6', categoryId: 'c4', shiftId: 'night', dayOffset: 0 },
      { id: uid(), workerId: 'w9', categoryId: 'c5', shiftId: 'night', dayOffset: 0 },
      
      // Dan 1 (utorak)
      { id: uid(), workerId: 'w13', categoryId: 'c1', shiftId: 'morning', dayOffset: 1 },
      { id: uid(), workerId: 'w5', categoryId: 'c1', shiftId: 'morning', dayOffset: 1 },
      { id: uid(), workerId: 'w2', categoryId: 'c2', shiftId: 'morning', dayOffset: 1 },
      { id: uid(), workerId: 'w7', categoryId: 'c4', shiftId: 'morning', dayOffset: 1 },
      { id: uid(), workerId: 'w4', categoryId: 'c3', shiftId: 'morning', dayOffset: 1 },
      
      { id: uid(), workerId: 'w1', categoryId: 'c1', shiftId: 'afternoon', dayOffset: 1 },
      { id: uid(), workerId: 'w10', categoryId: 'c1', shiftId: 'afternoon', dayOffset: 1 },
      { id: uid(), workerId: 'w8', categoryId: 'c2', shiftId: 'afternoon', dayOffset: 1 },
      { id: uid(), workerId: 'w12', categoryId: 'c4', shiftId: 'afternoon', dayOffset: 1 },
      { id: uid(), workerId: 'w11', categoryId: 'c3', shiftId: 'afternoon', dayOffset: 1 },
      
      { id: uid(), workerId: 'w13', categoryId: 'c1', shiftId: 'night', dayOffset: 1 },
      { id: uid(), workerId: 'w3', categoryId: 'c2', shiftId: 'night', dayOffset: 1 },
      { id: uid(), workerId: 'w15', categoryId: 'c4', shiftId: 'night', dayOffset: 1 },
      { id: uid(), workerId: 'w14', categoryId: 'c5', shiftId: 'night', dayOffset: 1 },
      
      // Dan 2 (srijeda)
      { id: uid(), workerId: 'w1', categoryId: 'c1', shiftId: 'morning', dayOffset: 2 },
      { id: uid(), workerId: 'w13', categoryId: 'c1', shiftId: 'morning', dayOffset: 2 },
      { id: uid(), workerId: 'w8', categoryId: 'c2', shiftId: 'morning', dayOffset: 2 },
      { id: uid(), workerId: 'w6', categoryId: 'c4', shiftId: 'morning', dayOffset: 2 },
      { id: uid(), workerId: 'w9', categoryId: 'c5', shiftId: 'morning', dayOffset: 2 },
      
      { id: uid(), workerId: 'w5', categoryId: 'c1', shiftId: 'afternoon', dayOffset: 2 },
      { id: uid(), workerId: 'w2', categoryId: 'c1', shiftId: 'afternoon', dayOffset: 2 },
      { id: uid(), workerId: 'w12', categoryId: 'c4', shiftId: 'afternoon', dayOffset: 2 },
      { id: uid(), workerId: 'w7', categoryId: 'c4', shiftId: 'afternoon', dayOffset: 2 },
      { id: uid(), workerId: 'w4', categoryId: 'c3', shiftId: 'afternoon', dayOffset: 2 },
      
      { id: uid(), workerId: 'w3', categoryId: 'c2', shiftId: 'night', dayOffset: 2 },
      { id: uid(), workerId: 'w10', categoryId: 'c4', shiftId: 'night', dayOffset: 2 },
      { id: uid(), workerId: 'w15', categoryId: 'c4', shiftId: 'night', dayOffset: 2 },
      
      // Dan 3 (četvrtak)
      { id: uid(), workerId: 'w5', categoryId: 'c1', shiftId: 'morning', dayOffset: 3 },
      { id: uid(), workerId: 'w2', categoryId: 'c1', shiftId: 'morning', dayOffset: 3 },
      { id: uid(), workerId: 'w3', categoryId: 'c2', shiftId: 'morning', dayOffset: 3 },
      { id: uid(), workerId: 'w10', categoryId: 'c4', shiftId: 'morning', dayOffset: 3 },
      { id: uid(), workerId: 'w11', categoryId: 'c3', shiftId: 'morning', dayOffset: 3 },
      
      { id: uid(), workerId: 'w1', categoryId: 'c1', shiftId: 'afternoon', dayOffset: 3 },
      { id: uid(), workerId: 'w13', categoryId: 'c1', shiftId: 'afternoon', dayOffset: 3 },
      { id: uid(), workerId: 'w8', categoryId: 'c2', shiftId: 'afternoon', dayOffset: 3 },
      { id: uid(), workerId: 'w15', categoryId: 'c4', shiftId: 'afternoon', dayOffset: 3 },
      { id: uid(), workerId: 'w14', categoryId: 'c5', shiftId: 'afternoon', dayOffset: 3 },
      
      { id: uid(), workerId: 'w6', categoryId: 'c4', shiftId: 'night', dayOffset: 3 },
      { id: uid(), workerId: 'w7', categoryId: 'c4', shiftId: 'night', dayOffset: 3 },
      { id: uid(), workerId: 'w9', categoryId: 'c5', shiftId: 'night', dayOffset: 3 },
      
      // Dan 4 (petak)
      { id: uid(), workerId: 'w13', categoryId: 'c1', shiftId: 'morning', dayOffset: 4 },
      { id: uid(), workerId: 'w1', categoryId: 'c1', shiftId: 'morning', dayOffset: 4 },
      { id: uid(), workerId: 'w8', categoryId: 'c2', shiftId: 'morning', dayOffset: 4 },
      { id: uid(), workerId: 'w7', categoryId: 'c4', shiftId: 'morning', dayOffset: 4 },
      { id: uid(), workerId: 'w4', categoryId: 'c3', shiftId: 'morning', dayOffset: 4 },
      
      { id: uid(), workerId: 'w5', categoryId: 'c1', shiftId: 'afternoon', dayOffset: 4 },
      { id: uid(), workerId: 'w2', categoryId: 'c1', shiftId: 'afternoon', dayOffset: 4 },
      { id: uid(), workerId: 'w3', categoryId: 'c2', shiftId: 'afternoon', dayOffset: 4 },
      { id: uid(), workerId: 'w10', categoryId: 'c4', shiftId: 'afternoon', dayOffset: 4 },
      { id: uid(), workerId: 'w11', categoryId: 'c3', shiftId: 'afternoon', dayOffset: 4 },
      
      { id: uid(), workerId: 'w12', categoryId: 'c4', shiftId: 'night', dayOffset: 4 },
      { id: uid(), workerId: 'w15', categoryId: 'c4', shiftId: 'night', dayOffset: 4 },
      { id: uid(), workerId: 'w14', categoryId: 'c5', shiftId: 'night', dayOffset: 4 },
    ],
    workerHours: { w1: 32, w2: 32, w3: 24, w4: 16, w5: 32, w6: 16, w7: 24, w8: 32, w9: 24, w10: 24, w11: 16, w12: 24, w13: 32, w14: 24, w15: 24 }
  }
];

export const MOCK_SETTINGS = {
  _id: 'set1',
  id: 'set1',
  minRestHours: 11,
  maxHoursPerWeek: 40,
  allowOvertime: true,
  maxOvertimeHours: 8,
  breakAfterHours: 6,
  breakDurationMinutes: 30,
  schedulingStrategy: 'fixed',
  weekendRotationEnabled: true,
  weekendCycleWeeks: 4,
};

export const MOCK_SHIFTS = [
  { _id: 'morning', id: 'morning', name: 'Jutarnja', start: '06:00', end: '14:00', color: '#f59e0b', icon: 'sun' },
  { _id: 'afternoon', id: 'afternoon', name: 'Popodnevna', start: '14:00', end: '22:00', color: '#3b82f6', icon: 'sunset' },
  { _id: 'night', id: 'night', name: 'Noćna', start: '22:00', end: '06:00', color: '#8b5cf6', icon: 'moon' },
];

export const MOCK_SWAPS = [
  { _id: uid(), id: uid(), requestingWorkerId: 'w1', targetWorkerId: 'w5', scheduleId: 's1', originalAssignmentId: MOCK_SCHEDULES[0].assignments[0].id, targetAssignmentId: MOCK_SCHEDULES[0].assignments[1].id, status: 'pending', requestedAt: isoDate(addDays(today, -1)) },
  { _id: uid(), id: uid(), requestingWorkerId: 'w6', targetWorkerId: 'w10', scheduleId: 's1', originalAssignmentId: MOCK_SCHEDULES[0].assignments[5].id, targetAssignmentId: MOCK_SCHEDULES[0].assignments[6].id, status: 'accepted_by_worker', requestedAt: isoDate(addDays(today, -2)) },
  { _id: uid(), id: uid(), requestingWorkerId: 'w9', targetWorkerId: 'w14', scheduleId: 's1', originalAssignmentId: MOCK_SCHEDULES[0].assignments[7].id, targetAssignmentId: MOCK_SCHEDULES[0].assignments[14].id, status: 'approved', requestedAt: isoDate(addDays(today, -3)) },
];

export const MOCK_AUDIT = [
  { _id: uid(), id: uid(), adminId: { username: 'Admin' }, timestamp: isoDate(addDays(today, -2)), details: { oldWorkerId: 'w2', newWorkerId: 'w1', shiftId: 'morning', dayOffset: 0 }, reason: 'Bolovanje radnika' },
  { _id: uid(), id: uid(), adminId: { username: 'Admin' }, timestamp: isoDate(addDays(today, -1)), details: { oldWorkerId: 'w7', newWorkerId: 'w6', shiftId: 'afternoon', dayOffset: 0 }, reason: 'Zamjena smjene' },
];

export const MOCK_HOLIDAYS = [
  { _id: uid(), id: uid(), name: 'Nova godina', date: '2026-01-01', isRecurring: true },
  { _id: uid(), id: uid(), name: 'Dan nezavisnosti', date: '2026-05-21', isRecurring: true },
  { _id: uid(), id: uid(), name: 'Božić', date: '2026-12-25', isRecurring: true },
  { _id: uid(), id: uid(), name: 'Dan firme', date: '2026-09-15', isRecurring: false },
];
