const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Setting = require('../models/Setting');
const ShiftType = require('../models/ShiftType');

dotenv.config(); // Automatski traži .env u trenutnom folderu (server)

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pustopoljina';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Povezano sa bazom za seeding...');

    // 1. Kreiranje admin korisnika
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'admin123password', // Preporučuje se promjena odmah nakon prve prijave
        role: 'admin'
      });
      await admin.save();
      console.log('Admin korisnik kreiran: admin / admin123password');
    } else {
      console.log('Admin korisnik već postoji.');
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

    console.log('Seeding završen uspješno!');
    process.exit(0);
  } catch (err) {
    console.error('Greška pri seedingu:', err.message);
    process.exit(1);
  }
};

seedDatabase();
