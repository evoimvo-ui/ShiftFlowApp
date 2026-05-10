const mongoose = require('mongoose');
const Organization = require('./models/Organization');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Category = require('./models/Category');

const fix = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pustopoljina');
    const org = await Organization.findOne({ name: /Pustopoljina/i });
    if (!org) { process.exit(1); }
    
    // Poveži sve radnike koji nemaju orgId ili imaju pogrešan
    await Worker.updateMany({}, { $set: { organizationId: org._id } });
    await Category.updateMany({}, { $set: { organizationId: org._id } });
    await User.updateMany({ username: /Vjetar/i }, { $set: { organizationId: org._id } });
    
    console.log('Svi radnici i kategorije su sada povezani sa Pustopoljinom.');
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
};
fix();
