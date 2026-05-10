module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'tajna_kljuc_za_shiftflow',
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/pustopoljina'
};
