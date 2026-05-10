const mongoose = require('mongoose');
const Organization = require('./models/Organization');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Category = require('./models/Category');
const Absence = require('./models/Absence');
const Schedule = require('./models/Schedule');
const Setting = require('./models/Setting');
const ShiftType = require('./models/ShiftType');
const Holiday = require('./models/Holiday');

const check = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pustopoljina');
    console.log('--- PROVJERA BAZE PODATAKA ---');

    const org = await Organization.findOne({ name: /Pustopoljina/i });
    if (org) {
      console.log(`Organizacija Pustopoljina pronađena: ID = ${org._id}`);
      
      const workersCount = await Worker.countDocuments({ organizationId: org._id });
      console.log(`Broj radnika u Pustopoljini: ${workersCount}`);
      
      const totalWorkers = await Worker.countDocuments({});
      console.log(`Ukupan broj radnika u cijeloj bazi: ${totalWorkers}`);

      const userVjetar = await User.findOne({ username: /Vjetar/i });
      console.log(`Korisnik Vjetar organizationId: ${userVjetar?.organizationId}`);
      
      if (userVjetar && org && String(userVjetar.organizationId) !== String(org._id)) {
        console.log('UPOZORENJE: Vjetar nije povezan sa Pustopoljinom! Popravljam...');
        userVjetar.organizationId = org._id;
        await userVjetar.save();
      }
    } else {
      console.log('Organizacija Pustopoljina NIJE pronađena u bazi!');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
check();
