const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const path = require('path');

const connectDB = require('./config/db');
const keys = require('./config/keys');
const seed = require('./utils/seed_logic'); // Promijenićemo seed.js da izvozi funkciju



const app = express();

// MongoDB Connection
connectDB().then(() => {
  seed();
});

// Middleware
app.use(cors());
app.use(express.json());
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

app.use('/api/workers', workerRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);

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
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server pokrenut na http://127.0.0.1:${PORT}`);
});
