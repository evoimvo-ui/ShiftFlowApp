const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/pustopoljina').then(async () => {
  const org = await mongoose.connection.collection('organizations').findOne({ name: 'Stup' });
  console.log(JSON.stringify(org.settings, null, 2));
  process.exit();
});