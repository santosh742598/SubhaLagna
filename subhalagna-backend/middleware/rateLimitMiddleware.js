'use strict';

/**
 * @file SubhaLagna v3.4.2 — Rate Limiting Middleware
 * @description   Defines multiple rate limiters:
 *                - `globalLimiter`  → applied to all routes (500 req / 15 min)
 *                - `authLimiter`    → applied to /api/auth/* (20 req / 15 min)
 *                - `healthLimiter`  → applied to /api/health (1000 req / 15 min)
 *                - `uploadLimiter`  → applied to photo upload routes
 *                All limits are configurable via environment variables.
 * @author        SubhaLagna Team
 * @version      3.4.2
 */

const rateLimit = require('express-rate-limit');

/** Window duration in milliseconds (default: 15 minutes) */
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);

/**
 * Global rate limiter — applied to all API routes.
 * Prevents DoS and excessive scraping.
 */
const globalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: parseInt(process.env.RATE_LIMIT_MAX || '500', 10),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

/**
 * Health check rate limiter — applied to /api/health.
 * Higher limit to accommodate frequent monitoring tools (e.g., UptimeRobot).
 */
const healthLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 1000, // 1000 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Health check rate limit exceeded.',
  },
});

/**
 * Auth-specific rate limiter — applied only to login/register/forgot-password.
 * Stricter to prevent brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes and try again.',
  },
});

/**
 * Upload rate limiter — applied to photo upload endpoints.
 * Prevents resource exhaustion from bulk file uploads.
 */
const uploadLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 20, // 20 upload requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload limit exceeded. Please try again later.',
  },
});

module.exports = { globalLimiter, authLimiter, uploadLimiter, healthLimiter };
