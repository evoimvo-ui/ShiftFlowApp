const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/pustopoljina').then(async () => {
  const result = await mongoose.connection.collection('organizations').updateOne(
    { name: 'Stup' },
    { $set: { 'settings.trialEndsAt': new Date('2024-01-01') } }
  );
  console.log('Done');
  process.exit();
});