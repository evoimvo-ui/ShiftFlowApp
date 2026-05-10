import { uid, isoDate, addDays, getWeekStart } from './helpers';

const today = new Date();
const weekStart = isoDate(getWeekStart(today));

export const MOCK_WORKERS = [
  { id: 'w1', name: 'Marko Marković', categoryIds: ['c1'], phone: '061 111 222', email: 'marko@example.com', maxHoursPerWeek: 40 },
  { id: 'w2', name: 'Ivan Ivanić', categoryIds: ['c1', 'c2'], phone: '061 333 444', email: 'ivan@example.com', maxHoursPerWeek: 40 },
  { id: 'w3', name: 'Petar Petrović', categoryIds: ['c2'], phone: '061 555 666', email: 'petar@example.com', maxHoursPerWeek: 40 },
  { id: 'w4', name: 'Sara Sarić', categoryIds: ['c3'], phone: '061 777 888', email: 'sara@example.com', maxHoursPerWeek: 35 },
  { id: 'w5', name: 'Ana Anić', categoryIds: ['c1'], phone: '061 999 000', email: 'ana@example.com', maxHoursPerWeek: 40 },
];

export const MOCK_CATEGORIES = [
  { id: 'c1', name: 'Prodaja', color: '#3b82f6', requiredPerShift: { morning: 2, afternoon: 2, night: 1 } },
  { id: 'c2', name: 'Skladište', color: '#10b981', requiredPerShift: { morning: 1, afternoon: 1, night: 1 } },
  { id: 'c3', name: 'Administracija', color: '#f59e0b', requiredPerShift: { morning: 1, afternoon: 0, night: 0 } },
];

export const MOCK_ABSENCES = [
  { id: 'a1', workerId: 'w1', type: 'sick', startDate: isoDate(addDays(today, -1)), endDate: isoDate(addDays(today, 2)), note: 'Prehlada', status: 'approved' },
  { id: 'a2', workerId: 'w3', type: 'vacation', startDate: isoDate(addDays(today, 5)), endDate: isoDate(addDays(today, 12)), note: 'Godišnji odmor', status: 'pending' },
];

export const MOCK_SCHEDULES = [
  {
    id: 's1',
    weekStart: weekStart,
    assignments: [
      { id: uid(), workerId: 'w2', categoryId: 'c1', shiftId: 'morning', dayOffset: 0 },
      { id: uid(), workerId: 'w5', categoryId: 'c1', shiftId: 'morning', dayOffset: 0 },
      { id: uid(), workerId: 'w2', categoryId: 'c1', shiftId: 'afternoon', dayOffset: 1 },
    ],
    workerHours: { w2: 16, w5: 8 }
  }
];

export const MOCK_SETTINGS = {
  id: 'set1',
  minRestHours: 11,
  maxHoursPerWeek: 40,
  allowOvertime: true,
  maxOvertimeHours: 8,
  breakAfterHours: 6,
  breakDurationMinutes: 30,
};

export const MOCK_SHIFTS = [
  { id: 'morning', name: 'Jutarnja', start: '06:00', end: '14:00', color: '#f59e0b', icon: 'sun' },
  { id: 'afternoon', name: 'Popodnevna', start: '14:00', end: '22:00', color: '#3b82f6', icon: 'sunset' },
  { id: 'night', name: 'Noćna', start: '22:00', end: '06:00', color: '#8b5cf6', icon: 'moon' },
];
