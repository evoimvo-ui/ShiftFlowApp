const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const path = require('path');

const connectDB = require('./config/db');
const keys = require('./config/keys');
const seed = require('./utils/seed_logic');

const app = express();

// MongoDB Connection
connectDB().then(() => {
  seed();
});

// Middleware
app.use(cors());

// Payment routes (must come BEFORE express.json()!)
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.send('Pustopoljina API radi!');
});

// Import Routes
const workerRoutes = require('./routes/workerRoutes');
const groupRoutes = require('./routes/groupRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const absenceRoutes = require('./routes/absenceRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const authRoutes = require('./routes/authRoutes');
const settingRoutes = require('./routes/settingRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const swapRoutes = require('./routes/swapRoutes');
const auditRoutes = require('./routes/auditRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auth = require('./middleware/auth');
const checkSubscription = require('./middleware/checkSubscription');

app.use('/api/workers', auth, checkSubscription, workerRoutes);
app.use('/api/groups', auth, checkSubscription, groupRoutes);
app.use('/api/categories', auth, checkSubscription, categoryRoutes);
app.use('/api/absences', auth, checkSubscription, absenceRoutes);
app.use('/api/schedules', auth, checkSubscription, scheduleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', auth, checkSubscription, settingRoutes);
app.use('/api/holidays', auth, checkSubscription, holidayRoutes);
app.use('/api/swaps', auth, checkSubscription, swapRoutes);
app.use('/api/audit', auth, checkSubscription, auditRoutes);
app.use('/api/notifications', auth, checkSubscription, notificationRoutes);

// Posluživanje statičkih datoteka u produkciji
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Pustopoljina API radi!');
  });
}

const PORT = keys.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server pokrenut na portu ${PORT}`);
});