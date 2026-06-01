const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pustopoljina', {
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    console.log(`MongoDB Povezan: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Greška: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
