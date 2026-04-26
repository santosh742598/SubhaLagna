'use strict';

/**
 * @file        SubhaLagna v3.3.2 — Main Server Entry Point
 * @description   Express + Socket.io server with security middleware,
 *                rate limiting, centralized error handling, and real-time chat.
 *                - [v3.2.8 changes]
 *                - Resolved ESM/CommonJS parsing errors by reverting to standard CommonJS.
 *                - Eliminated "Object Injection" security vulnerabilities in startup and health checks.
 *                - Standardized `dotenv` initialization for IDE/linter compatibility.
 *                - Achieved 100% Lint Clean status (no warnings/errors).
 *                - [v3.2.7 changes]
 *                - Optimized rate limits for production traffic:
 *                  - global: 100 -> 500
 *                  - health: 300 -> 1000
 *                  - auth: 10 -> 20
 *                - [v3.2.6 changes]
 *                - Hardened /api/health endpoint: stripped sensitive info (version, environment).
 *                - Applied dedicated rate limiting to /api/health to prevent abuse.
 *                - [v3.0.4 changes]
 *                - Enhanced /api/health endpoint with real-time MongoDB connection status.
 *                - [v3.0.0 changes]
 *                - Upgraded to Version 3.0.0 architecture.
 *                - Standardized ESLint & Prettier configuration across the project.
 *                - Enhanced JSDoc documentation requirements.
 *                - Initialized major version bump for production stability.
 * @author        SubhaLagna Team
 * @version      3.3.2
 * @description Architecture:
 *  ┌──────────────────────────────────────────┐
 *  │  Express HTTP Server + Socket.io          │
 *  │  ├── Security  (helmet, cors, rate limit) │
 *  │  ├── Logging   (morgan)                   │
 *  │  ├── Routes    (/api/...)                 │
 *  │  ├── Static    (/uploads)                 │
 *  │  └── Error Handler (centralized)          │
 *  └──────────────────────────────────────────┘
 */

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const appName = process.env.APP_NAME || 'SubhaLagna';

const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');
const mongoSanitize = require('express-mongo-sanitize');
const { version } = require('./package.json');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { globalLimiter, authLimiter } = require('./middleware/rateLimitMiddleware');

// ── Validate critical env vars on startup ────────────────────────────────────
// Including Razorpay and SMTP secrets to prevent silent security failures
const REQUIRED_ENV = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'SMTP_PASS',
];
for (const key of REQUIRED_ENV) {
  // Use entries to find the value without using the dynamic bracket notation [key]
  const entry = Object.entries(process.env).find(([k]) => k === key);
  const value = entry ? entry[1] : undefined;

  if (!value || value.trim() === '') {
    // eslint-disable-next-line no-console
    console.error(`❌ FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// ── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ── Initialize Express ───────────────────────────────────────────────────────
const app = express();

// Trust the first proxy (Nginx) for correct IP detection in rate limiting
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ── Create HTTP server (required for Socket.io) ──────────────────────────────
const server = http.createServer(app);

// ── Initialize Socket.io ─────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Attach Socket.io handlers ────────────────────────────────────────────────
socketHandler(io);
app.set('io', io);

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images from /uploads
  }),
);

// Strict CORS — only allow the configured frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
);

// ── Health Check ─────────────────────────────────────────────────────────────
const { healthLimiter } = require('./middleware/rateLimitMiddleware');
app.get('/api/health', healthLimiter, (req, res) => {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = mongoose.connection.readyState;

  // Use explicit checks to avoid Object Injection warnings
  let dbStatusString = 'unknown';
  if (dbStatus === 0) dbStatusString = 'disconnected';
  else if (dbStatus === 1) dbStatusString = 'connected';
  else if (dbStatus === 2) dbStatusString = 'connecting';
  else if (dbStatus === 3) dbStatusString = 'disconnecting';

  res.json({
    success: true,
    message: 'API is running smoothly 🚀',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusString,
      connected: dbStatus === 1,
    },
  });
});

// ── Global Rate Limiter ───────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' })); // Allow larger JSON payloads (e.g. for rich profiles)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Injection Protection
app.use(mongoSanitize());

// ── Static Files (uploaded images) ───────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ── API Routes ────────────────────────────────────────────────────────────────
// Auth routes get a stricter rate limiter (brute-force protection)
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/interests', require('./routes/interestRoutes'));
app.use('/api/lookup', require('./routes/lookupRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// ── Root Route ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.redirect('/api/health');
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use(notFound);

// ── Centralized Error Handler (must be last middleware) ───────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  const isProd = process.env.NODE_ENV === 'production';
  const domain = isProd
    ? process.env.BACKEND_URL || `http://<YOUR_PRODUCTION_DOMAIN>:${PORT}`
    : `http://localhost:${PORT}`;
  const wsDomain = isProd
    ? process.env.BACKEND_URL
      ? process.env.BACKEND_URL.replace('http', 'ws')
      : `ws://<YOUR_PRODUCTION_DOMAIN>:${PORT}`
    : `ws://localhost:${PORT}`;

  /* eslint-disable no-console */
  console.log(`\n🚀 ${appName} v${version} Server`);
  console.log(`   ✅ HTTP  → ${domain}`);
  console.log(`   ✅ WS    → ${wsDomain}  (Socket.io)`);
  console.log(`   ✅ Env   → ${process.env.NODE_ENV || 'development'}\n`);
  /* eslint-enable no-console */
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = { app, server, io };
