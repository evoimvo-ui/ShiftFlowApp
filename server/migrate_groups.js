const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Group = require('./models/Group');
const Worker = require('./models/Worker');
const Organization = require('./models/Organization');

dotenv.config();

const migrate = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pustopoljina';
    console.log('Povezivanje na bazu:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('Baza povezana.');

    // 1. Pronađi sve organizacije
    const organizations = await Organization.find({});
    console.log(`Pronađeno ${organizations.length} organizacija.`);

    for (const org of organizations) {
      console.log(`Obrađujem organizaciju: ${org.name}`);

      // 2. Provjeri postoji li "Main Group" za ovu organizaciju
      let defaultGroup = await Group.findOne({ name: 'Main Group', organizationId: org._id });
      if (!defaultGroup) {
        defaultGroup = new Group({
          name: 'Main Group',
          organizationId: org._id,
          description: 'Default group for all workers'
        });
        await defaultGroup.save();
        console.log(`Kreirana Main Group za ${org.name}`);
      }

      // 3. Dodijeli ovu grupu svim radnicima u ovoj organizaciji koji nemaju groupId
      const result = await Worker.updateMany(
        { organizationId: org._id, groupId: { $exists: false } },
        { $set: { groupId: defaultGroup._id } }
      );
      console.log(`Ažurirano ${result.modifiedCount} radnika za organizaciju ${org.name}`);
    }

    console.log('Migracija uspješno završena.');
    process.exit(0);
  } catch (err) {
    console.error('Greška pri migraciji:', err.message);
    process.exit(1);
  }
};

migrate();
