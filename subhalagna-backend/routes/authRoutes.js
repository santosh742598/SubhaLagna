"use strict";

/**
 * @file SubhaLagna v3.0.8 — Auth Routes
 * @description   Route definitions for authentication endpoints.
 *                All public routes use input validation before reaching controllers.
 *                Protected routes require a valid JWT access token.
 *
 * Base path: /api/auth
 *
 * Public:
 *   POST /register         → create account
 *   POST /verify-email     → confirm OTP
 *   POST /resend-otp       → request new OTP
 *   POST /login            → issue tokens
 *   POST /refresh-token    → rotate tokens
 *   POST /forgot-password  → send reset email
 *   POST /reset-password/:token → set new password
 *
 *                v2.4.0 changes:
 *                  - Added POST /resend-otp endpoint for email verification.
 *
 * Private:
 *   GET  /me               → get current user
 *   POST /logout           → invalidate refresh token
 * @author SubhaLagna Team
 * @version      3.0.8
 */

const express = require('express');
const router = express.Router();

const {
  registerUser,
  verifyEmail,
  resendOTP,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  logoutUser,
  getMe,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  validate,
} = require('../middleware/validateMiddleware');

// ── Public Auth Routes ────────────────────────────────────────────────────────
router.post('/register', registerRules, validate, registerUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/login', loginRules, validate, loginUser);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password/:token', resetPasswordRules, validate, resetPassword);

// ── Protected Auth Routes ─────────────────────────────────────────────────────
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);

module.exports = router;
