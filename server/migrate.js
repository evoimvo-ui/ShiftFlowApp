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
const AuditLog = require('./models/AuditLog');

const migrate = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pustopoljina');
    console.log('Connected to DB...');

    // 1. Pronađi organizaciju Pustopoljina
    const org = await Organization.findOne({ name: /Pustopoljina/i });
    if (!org) {
      console.error('Organizacija Pustopoljina nije pronađena. Prvo se registrujte!');
      process.exit(1);
    }
    const orgId = org._id;
    console.log(`Pronađena organizacija: ${org.name} (${orgId})`);

    // 2. Ažuriraj korisnika Vjetar
    const user = await User.findOne({ username: /Vjetar/i });
    if (user) {
      user.organizationId = orgId;
      await user.save();
      console.log('Korisnik Vjetar ažuriran.');
    }

    // 3. Masovno ažuriranje svih modela koji nemaju organizationId
    const models = [Worker, Category, Absence, Schedule, ShiftType, Holiday, AuditLog];
    
    for (const Model of models) {
      const result = await Model.updateMany(
        { organizationId: { $exists: false } },
        { $set: { organizationId: orgId } }
      );
      console.log(`Ažuriran model ${Model.modelName}: ${result.modifiedCount} dokumenata.`);
    }

    // Poseban slučaj za Setting
    const existingSetting = await Setting.findOne({ organizationId: orgId });
    const oldSetting = await Setting.findOne({ organizationId: { $exists: false } });
    
    if (oldSetting) {
      if (existingSetting) {
        // Ako oba postoje, prebriši novi sa starim podacima i obriši stari
        console.log('Spajanje postavki...');
        const oldData = oldSetting.toObject();
        delete oldData._id;
        oldData.organizationId = orgId;
        await Setting.findByIdAndUpdate(existingSetting._id, oldData);
        await Setting.findByIdAndDelete(oldSetting._id);
      } else {
        oldSetting.organizationId = orgId;
        await oldSetting.save();
      }
      console.log('Postavke ažurirane.');
    }

    console.log('Migracija uspešno završena!');
    process.exit(0);
  } catch (err) {
    console.error('Greška pri migraciji:', err);
    process.exit(1);
  }
};

migrate();
