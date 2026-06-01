const User = require('../models/User');
const Organization = require('../models/Organization');
const Group = require('../models/Group');
const Setting = require('../models/Setting');
const ShiftType = require('../models/ShiftType');

const seedDatabase = async () => {
  // Brza provjera da li je seeding već urađen (preko varijable u memoriji)
  if (global.isSeeded) return;

  try {
    console.log('Provjera baze za seeding...');

    // 1. Kreiranje admin korisnika (prvo korisnik jer organizacija treba ownerId)
    let admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      admin = new User({
        username: 'admin',
        password: 'admin123password',
        role: 'admin'
      });
      await admin.save();
      console.log('Admin korisnik kreiran: admin / admin123password');
    }

    // 2. Kreiranje podrazumijevane organizacije
    let organization = await Organization.findOne({ slug: 'glavna-organizacija' });
    if (!organization) {
      organization = new Organization({
        name: 'Glavna Organizacija',
        slug: 'glavna-organizacija',
        ownerId: admin._id
      });
      await organization.save();
      console.log('Organizacija kreirana.');
    }

    // 3. Poveži korisnika sa organizacijom ako nije povezan
    if (!admin.organizationId) {
      await User.updateOne(
        { _id: admin._id },
        { $set: { organizationId: organization._id } }
      );
      console.log('Admin korisnik povezan sa organizacijom.');
    }

    // 4. Kreiranje podrazumijevane grupe
    let defaultGroup = await Group.findOne({ name: 'Main Group', organizationId: organization._id });
    if (!defaultGroup) {
      defaultGroup = new Group({
        name: 'Main Group',
        organizationId: organization._id,
        description: 'Default group for all workers'
      });
      await defaultGroup.save();
      console.log('Podrazumijevana grupa kreirana.');
    }

    // 5. Osnovne postavke
    const settingsExists = await Setting.findOne({ organizationId: organization._id });
    if (!settingsExists) {
      await Setting.create({
        organizationId: organization._id,
        minRestHours: 11,
        maxHoursPerWeek: 40,
        workDays: 7
      });
      console.log('Osnovne postavke kreirane.');
    }

    // 4. Osnovne smjene
    const shiftsCount = await ShiftType.countDocuments({ organizationId: organization._id });
    if (shiftsCount === 0) {
      const defaultShifts = [
        { name: 'Prva smjena', start: '07:00', end: '15:00', color: '#3b82f6', organizationId: organization._id },
        { name: 'Druga smjena', start: '15:00', end: '23:00', color: '#10b981', organizationId: organization._id },
        { name: 'Noćna smjena', start: '23:00', end: '07:00', color: '#6366f1', organizationId: organization._id }
      ];
      await ShiftType.insertMany(defaultShifts);
      console.log('Osnovne smjene kreirane.');
    }

    console.log('Seeding provjera završena uspješno.');
    global.isSeeded = true;
  } catch (err) {
    console.error('Greška pri seedingu:', err.message);
  }
};

module.exports = seedDatabase;
