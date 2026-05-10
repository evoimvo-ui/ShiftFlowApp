const User = require('../models/User');
const Setting = require('../models/Setting');
const ShiftType = require('../models/ShiftType');

const seedDatabase = async () => {
  try {
    console.log('Provjera baze za seeding...');

    // 1. Kreiranje admin korisnika
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'admin123password',
        role: 'admin'
      });
      await admin.save();
      console.log('Admin korisnik kreiran: admin / admin123password');
    }

    // 2. Osnovne postavke
    const settingsExists = await Setting.findOne();
    if (!settingsExists) {
      await Setting.create({
        minRestHours: 11,
        maxHoursPerWeek: 40,
        workDays: 7
      });
      console.log('Osnovne postavke kreirane.');
    }

    // 3. Osnovne smjene
    const shiftsCount = await ShiftType.countDocuments();
    if (shiftsCount === 0) {
      const defaultShifts = [
        { name: 'Prva smjena', start: '07:00', end: '15:00', color: '#3b82f6', weight: 1 },
        { name: 'Druga smjena', start: '15:00', end: '23:00', color: '#10b981', weight: 1 },
        { name: 'Noćna smjena', start: '23:00', end: '07:00', color: '#6366f1', weight: 1.5 }
      ];
      await ShiftType.insertMany(defaultShifts);
      console.log('Osnovne smjene kreirane.');
    }

    console.log('Seeding provjera završena.');
  } catch (err) {
    console.error('Greška pri seedingu:', err.message);
  }
};

module.exports = seedDatabase;
