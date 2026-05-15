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
  // Koristimo UTC metode da izbjegnemo timezone shift
  return d.getUTCFullYear() + '-' + 
         String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + 
         String(d.getUTCDate()).padStart(2, '0');
}

function addDays(date, n) {
  let d;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [y, m, day] = date.split('-').map(Number);
    // Kreiraj kao UTC da izbjegneš pomjeranje
    d = new Date(Date.UTC(y, m - 1, day));
  } else {
    d = new Date(date);
  }
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function isWorkerAbsent(workerId, date, absences) {
  const targetIso = isoDate(date);
  
  return absences.some(a => {
    const aWorkerId = a.workerId?._id || a.workerId;
    if (aWorkerId.toString() !== workerId.toString() || a.status !== 'approved') return false;

    const startIso = isoDate(a.startDate);
    const endIso = isoDate(a.endDate);

    return targetIso >= startIso && targetIso <= endIso;
  });
}

function isHoliday(date, holidays) {
  const iso = isoDate(date);
  const monthDay = iso.slice(5); // MM-DD
  return holidays.some(h => h.date === iso || (h.isRecurring && h.date.slice(5) === monthDay));
}

function getShiftId(shift) {
  return shift.id || (shift._id ? shift._id.toString() : null);
}

function generateSchedule(weekStart, workers, categories, absences, shiftTypes, settings, historicalSchedules = [], holidays = []) {
  const assignments = [];
  const workerHours = new Map();
  const workerDaysWorked = new Map(); // Broj radnih dana u sedmici po radniku
  const workerCycleWeek = new Map(); // Izračunata sedmica ciklusa za svakog radnika
  const workerShiftCount = new Map(); // Broj svake vrste smjene po radniku za rotaciju

  workers.forEach(w => {
    workerHours.set(w._id.toString(), 0);
    workerDaysWorked.set(w._id.toString(), 0);
    workerShiftCount.set(w._id.toString(), {});
  });

  console.log('Categories with requiredPerShift:');
  categories.forEach(cat => {
    console.log(`Category: ${cat.name}, requiredPerShift:`, cat.requiredPerShift);
    console.log(`Category _id: ${cat._id?.toString()}`);
  });
    
  workers.forEach(w => {
    // Izračunaj sedmicu ciklusa ako je rotacija uključena
    if (settings.weekendRotationEnabled && w.weekendCycleStart) {
      const start = new Date(w.weekendCycleStart);
      const current = new Date(weekStart);
      // Koristimo razliku u milisekundama, ali pazimo na smjer
      const diffTime = current - start;
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      
      // Koristimo modulo koji radi ispravno i za negativne brojeve
      let cycleWeek = ((diffWeeks % settings.weekendCycleWeeks) + settings.weekendCycleWeeks) % settings.weekendCycleWeeks;
      cycleWeek += 1; // Da dobijemo 1-based index (1, 2, 3...)
      
      workerCycleWeek.set(w._id.toString(), cycleWeek);
    }
  });

  // Dani u sedmici (0-6)
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = addDays(weekStart, dayOffset);
    const isWeekend = dayOffset === 5 || dayOffset === 6; // Subota (5) i Nedjelja (6)
    console.log(`DEBUG: Day ${dayOffset} (${currentDate.toISOString().split('T')[0]}), isWeekend: ${isWeekend}`);

    // Sortiraj smjene po važnosti (npr. po vremenu početka)
    const sortedShifts = [...shiftTypes].sort((a, b) => a.start.localeCompare(b.start));

    for (const shift of sortedShifts) {
      const sIdForMap = getShiftId(shift);
      // Za svaku kategoriju u smjeni
      for (const cat of categories) {
        // Koliko radnika ove kategorije treba u ovoj smjeni?
        let needed = 0;
        
        // MongoDB Map - koristimo .get() metod za pristup
        needed = 0;
        if (cat.requiredPerShift && typeof cat.requiredPerShift.get === 'function') {
          needed = cat.requiredPerShift.get(sIdForMap) || 0;
        } else if (cat.requiredPerShift && typeof cat.requiredPerShift === 'object') {
          // Fallback za običan objekat
          needed = cat.requiredPerShift[sIdForMap] || 0;
        }
        
        console.log(`DEBUG: Shift ${shift.name} (${sIdForMap}), Category ${cat.name}, needed = ${needed}`);
        
        // Fallback: samo ako requiredPerShift ne postoji ili je prazan, postavi default vrednosti
        const hasRequiredPerShift = cat.requiredPerShift && (
          (typeof cat.requiredPerShift.get === 'function' && cat.requiredPerShift.size > 0) ||
          (typeof cat.requiredPerShift === 'object' && Object.keys(cat.requiredPerShift).length > 0)
        );
        
        if (!hasRequiredPerShift && needed === 0) {
          // Default vrednosti ako nije ništa postavljeno
          if (cat.name.toLowerCase().includes('studio')) {
            needed = 1;
            console.log(`DEBUG: Fallback - setting needed = 1 for ${cat.name} (no requiredPerShift data)`);
          } else if (cat.name.toLowerCase().includes('eng')) {
            needed = 1;
            console.log(`DEBUG: Fallback - setting needed = 1 for ${cat.name} (no requiredPerShift data)`);
          }
        }
        
        // Proveri specifične zahteve za vikende
        console.log(`DEBUG: Weekend check - isWeekend: ${isWeekend}, cat.useWeekendWeights: ${cat.useWeekendWeights}`);
        
        // Ako je vikend i useWeekendWeights nije uključen, postavi needed = 0
        if (isWeekend && !cat.useWeekendWeights) {
          needed = 0;
          console.log(`DEBUG: Weekend disabled for ${cat.name} - setting needed = 0`);
        } else if (isWeekend && cat.useWeekendWeights) {
          let weekendNeeded = 0;
          if (cat.requiredPerShiftWeekend && typeof cat.requiredPerShiftWeekend.get === 'function') {
            weekendNeeded = cat.requiredPerShiftWeekend.get(sIdForMap) || 0;
          } else if (cat.requiredPerShiftWeekend && typeof cat.requiredPerShiftWeekend === 'object') {
            weekendNeeded = cat.requiredPerShiftWeekend[sIdForMap] || 0;
          }
          // Uvek koristi weekendNeeded, ne fallback na regularne vrednosti
          needed = weekendNeeded;
          console.log(`DEBUG: Weekend override - ${cat.name} for ${shift.name}: weekendNeeded = ${weekendNeeded}, final needed = ${needed}`);
        }
        
        // Proveri specifične zahteve za praznike
        if (isHoliday(currentDate, holidays) && cat.useHolidayWeights) {
          let holidayNeeded = 0;
          if (cat.requiredPerShiftHoliday && typeof cat.requiredPerShiftHoliday.get === 'function') {
            holidayNeeded = cat.requiredPerShiftHoliday.get(sIdForMap) || 0;
          } else if (cat.requiredPerShiftHoliday && typeof cat.requiredPerShiftHoliday === 'object') {
            holidayNeeded = cat.requiredPerShiftHoliday[sIdForMap] || 0;
          }
          needed = holidayNeeded || needed;
          console.log(`DEBUG: Holiday override - ${cat.name} for ${shift.name}: holidayNeeded = ${holidayNeeded}, final needed = ${needed}`);
        }
        
        if (needed === 0) {
          console.log(`DEBUG: Skipping ${cat.name} for ${shift.name} - needed = 0`);
          continue; // Preskoči ako nema potrebe za ovom kategorijom u ovoj smjeni
        }
        
        for (let i = 0; i < needed; i++) {
          const available = workers.filter(w => {
            const wId = w._id.toString();
            
            // 1. PROVJERA: Da li je radnik već dodijeljen bilo kojoj smjeni u ovom danu?
            const alreadyAssignedToday = assignments.some(a => 
              !a.isWarning && 
              a.dayOffset === dayOffset && 
              a.workerId.toString() === wId
            );
            if (alreadyAssignedToday) return false;

            // 2. PROVJERA: Da li je radnik slobodan (nije na bolovanju/odmoru)?
            if (isWorkerAbsent(wId, currentDate, absences)) return false;

            // 3. PROVJERA: Da li radnik pripada traženoj kategoriji?
            const wCats = (w.categoryIds || []).map(id => id.toString());
            if (!wCats.includes(cat._id.toString())) return false;

            // 4. PROVJERA: Ciklična rotacija vikenda
            if (isWeekend && settings.weekendRotationEnabled && workerCycleWeek.has(wId)) {
              const cycleWeek = workerCycleWeek.get(wId);
              // Radna sedmica je zadnja u ciklusu (npr. 3. sedmica)
              // Sve ostale sedmice su slobodne za vikend
              if (cycleWeek < settings.weekendCycleWeeks) return false;
            }

            // 5. PROVJERA: Strategija odmora (Max radnih dana u sedmici)
            const daysWorked = workerDaysWorked.get(wId);
            const maxDays = settings.schedulingStrategy === 'accumulation' ? 6 : 5;
            if (daysWorked >= maxDays) return false;

            // 6. PROVJERA: Max sati sedmično
            const currentHours = workerHours.get(wId);
            const shiftHours = shiftDurationHours(shift);
            if (currentHours + shiftHours > (w.maxHoursPerWeek || 40) + (settings.allowOvertime ? settings.maxOvertimeHours || 0 : 0)) return false;

            return true;
          });

          if (available.length > 0) {
            // Biramo radnika sa najmanje sati do sada, uzimajući u obzir rotaciju smjena
            available.sort((a, b) => {
              const aHours = workerHours.get(a._id.toString());
              const bHours = workerHours.get(b._id.toString());
              const aShiftCount = (workerShiftCount.get(a._id.toString()) || {})[sIdForMap] || 0;
              const bShiftCount = (workerShiftCount.get(b._id.toString()) || {})[sIdForMap] || 0;
              // Prefer manje sati, zatim manje puta na ovoj smjeni (za rotaciju)
              const score = (aHours - bHours) * 2 + (aShiftCount - bShiftCount);
              return score;
            });
            const selected = available[0];
            const sId = selected._id.toString();

            assignments.push({
              workerId: selected._id,
              shiftId: sIdForMap,
              categoryId: cat._id,
              dayOffset,
              isWarning: false
            });

            workerHours.set(sId, workerHours.get(sId) + shiftDurationHours(shift));
            workerDaysWorked.set(sId, workerDaysWorked.get(sId) + 1);
            
            // Ažuriraj broj ove vrste smjene za rotaciju
            const shiftCounts = workerShiftCount.get(sId) || {};
            shiftCounts[sIdForMap] = (shiftCounts[sIdForMap] || 0) + 1;
            workerShiftCount.set(sId, shiftCounts);
          } else {
            // Nema dostupnog radnika - kreiraj upozorenje
            assignments.push({
              shiftId: sIdForMap,
              categoryId: cat._id,
              dayOffset,
              isWarning: true,
              needed: 1
            });
          }
        }
      }
    }
  }

  try {
    return { assignments, workerHours: Object.fromEntries(workerHours) };
  } catch (error) {
    console.error('SCHEDULER ERROR:', error);
    return { assignments: [], workerHours: {} };
  }
}

module.exports = {
  generateSchedule,
  parseTime,
  shiftDurationHours,
  isWorkerAbsent,
  isoDate,
  addDays
};
