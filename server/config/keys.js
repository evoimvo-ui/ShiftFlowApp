const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in production environment.');
}

if (isProduction && !process.env.MONGODB_URI) {
  throw new Error('FATAL ERROR: MONGODB_URI is not defined in production environment.');
}

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_only_for_local_testing',
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/pustopoljina'
};
