const mongoose = require('mongoose');
const Organization = require('./models/Organization');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Schedule = require('./models/Schedule');
const Absence = require('./models/Absence');
const Category = require('./models/Category');
const ShiftType = require('./models/ShiftType');
const AuditLog = require('./models/AuditLog');
const SwapRequest = require('./models/SwapRequest');

const mongoURI = 'mongodb+srv://evoimeneelvo_db_user:Budhantonspeaker7Atlas@cluster0.bmz4a9k.mongodb.net/?retryWrites=true&w=majority';

async function clean() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Povezan na bazu.');

    const orgsToDelete = await Organization.find({ name: { $in: ['Moja Firma', 'Glavna Organizacija'] } });
    const idsToDelete = orgsToDelete.map(o => o._id);
    
    if (idsToDelete.length > 0) {
      console.log('Brisanje podataka za organizacije:', orgsToDelete.map(o => o.name));
      
      await Promise.all([
        User.deleteMany({ organizationId: { $in: idsToDelete } }),
        Worker.deleteMany({ organizationId: { $in: idsToDelete } }),
        Schedule.deleteMany({ organizationId: { $in: idsToDelete } }),
        Absence.deleteMany({ organizationId: { $in: idsToDelete } }),
        Category.deleteMany({ organizationId: { $in: idsToDelete } }),
        ShiftType.deleteMany({ organizationId: { $in: idsToDelete } }),
        AuditLog.deleteMany({ organizationId: { $in: idsToDelete } }),
        SwapRequest.deleteMany({ organizationId: { $in: idsToDelete } }),
        Organization.deleteMany({ _id: { $in: idsToDelete } })
      ]);
      console.log('Obrisane organizacije i njihovi podaci.');
    } else {
      console.log('Nisu pronađene organizacije za brisanje.');
    }

    // Obriši nalog Tedi Tedić (ako postoji kao duplikat ili pogrešan nalog)
    const tedi = await User.findOne({ username: 'Tedi Tedić' });
    if (tedi) {
      await User.deleteOne({ _id: tedi._id });
      console.log('Obrisan nalog Tedi Tedić.');
    }

    process.exit(0);
  } catch (e) {
    console.error('Greška:', e);
    process.exit(1);
  }
}

clean();
