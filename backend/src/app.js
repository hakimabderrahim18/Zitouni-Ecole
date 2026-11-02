const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const path = require('path');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socket.manager');
const errorHandler = require('./middlewares/error.middleware');

// Routes Import
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const teacherRoutes = require('./routes/teacher.routes');
const studentRoutes = require('./routes/student.routes');
const parentRoutes = require('./routes/parent.routes');
const messageRoutes = require('./routes/message.routes');
const postRoutes = require('./routes/post.routes');
const notificationRoutes = require('./routes/notification.routes');
const supervisorRoutes = require('./routes/supervisor.routes');
const receptionistRoutes = require('./routes/receptionist.routes');
const financeRoutes = require('./routes/finance.routes');
const schoolSettingRoutes = require('./routes/schoolSetting.routes');
const importRoutes = require('./routes/import.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const timetableRoutes = require('./routes/timetable.routes');
const lessonNotebookRoutes = require('./routes/lessonNotebook.routes');
const backupRoutes = require('./routes/backup.routes');
const administrativeRequestRoutes = require('./routes/administrativeRequest.routes');
const { initAutomatedBackups } = require('./services/backup.service');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize WebSockets
initSocket(server);

// Serve uploads static folder (direct and /api prefixed)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Security & Optimization Middlewares
app.use(helmet());

// Allow one or more comma-separated origins. Trailing slashes are stripped so a
// value like "https://app.vercel.app/" still matches the browser origin
// "https://app.vercel.app".
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// Always allow Metro bundler & Expo dev origins
[
  'http://localhost:8081',
  'http://localhost:8082',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'http://localhost:19000',
  'http://localhost:19006',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
].forEach((origin) => {
  if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin);
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, same-origin)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.startsWith('http://localhost:') ||
        cleanOrigin.startsWith('http://127.0.0.1:') ||
        cleanOrigin.startsWith('http://192.168.') ||
        cleanOrigin.startsWith('http://10.')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health Check API (also reports which database the server is connected to)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    db: {
      state: mongoose.connection.readyState, // 1 = connected
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
  });
});

// REST API Endpoints Mount (dual mounted with /api and direct prefix for full compatibility)
const apiRoutes = [
  ['/auth', authRoutes],
  ['/admin', adminRoutes],
  ['/teachers', teacherRoutes],
  ['/students', studentRoutes],
  ['/parents', parentRoutes],
  ['/messages', messageRoutes],
  ['/posts', postRoutes],
  ['/notifications', notificationRoutes],
  ['/supervisors', supervisorRoutes],
  ['/receptionist', receptionistRoutes],
  ['/finance', financeRoutes],
  ['/school-settings', schoolSettingRoutes],
  ['/import', importRoutes],
  ['/attendance', attendanceRoutes],
  ['/timetable', timetableRoutes],
  ['/lessons', lessonNotebookRoutes],
  ['/backups', backupRoutes],
  ['/administrative-requests', administrativeRequestRoutes],
];

apiRoutes.forEach(([routePath, routeHandler]) => {
  app.use(`/api${routePath}`, routeHandler);
  app.use(routePath, routeHandler);
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Initialize periodic automated encrypted backups (Art. 65)
  initAutomatedBackups();
});

module.exports = { app, server };
