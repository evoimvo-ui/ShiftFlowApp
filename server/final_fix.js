
const mongoose = require('mongoose');
const Organization = require('./models/Organization');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Category = require('./models/Category');

const finalFix = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pustopoljina');
    
    // 1. Pronađi ili kreiraj Pustopoljinu
    let org = await Organization.findOne({ name: /Pustopoljina/i });
    if (!org) {
      const owner = await User.findOne({ username: /Vjetar/i });
      org = await Organization.create({ 
        name: 'Pustopoljina', 
        slug: 'pustopoljina', 
        ownerId: owner ? owner._id : new mongoose.Types.ObjectId() 
      });
    }

    // 2. Kreiraj osnovnu kategoriju
    let cat = await Category.findOne({ organizationId: org._id });
    if (!cat) {
      cat = await Category.create({ 
        name: 'Opšte', 
        organizationId: org._id, 
        color: '#3b82f6' 
      });
    }

    // 3. Prebaci SVE radnike u Pustopoljinu i dodeli im kategoriju
    const workers = await Worker.find();
    for (const w of workers) {
      w.organizationId = org._id;
      if (!w.categoryIds || w.categoryIds.length === 0) {
        w.categoryIds = [cat._id];
      }
      await w.save();
    }

    // 4. Ažuriraj korisnika Vjetar
    await User.updateOne({ username: /Vjetar/i }, { $set: { organizationId: org._id } });

    console.log('SISTEM RESTARTUJAN: Svi radnici su sada u Pustopoljini sa kategorijom Opšte.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
finalFix();
