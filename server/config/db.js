const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pustopoljina', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Povezan: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Greška: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
