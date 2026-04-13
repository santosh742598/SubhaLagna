/**
 * @fileoverview SubhaLagna v3.0.1 — Auth Controller
 * @description   Handles all authentication operations including:
 *                - Secure registration and 6-digit OTP verification.
 *                - JWT rotation (Access/Refresh) strategy.
 *                - Secure password recovery and logout.
 *                - [v3.0.0 changes]
 *                - Upgraded to Version 3.0.0.
 *                - Implemented strict JSDoc header validation.
 *                - Standardized security-first error handling (apiResponse).
 *                - Verified Express 5 compatibility layers.
 * @author        SubhaLagna Team
 * @version      3.0.1
 */

'use strict';

const crypto = require('crypto');

const User = require('../models/User');
const Profile = require('../models/Profile');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ── Helper: Generate a 6-digit OTP ───────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Helper: Token pair response ───────────────────────────────────────────────
/**
 * Build the standard token-pair response object.
 * @param {object} user     - User Mongoose document
 * @param {object} profile  - Profile Mongoose document | null
 * @returns {object}
 */
const buildAuthResponse = (user, profile) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isPremium: user.isPremium,
  premiumPlan: user.premiumPlan,
  isEmailVerified: user.isEmailVerified,
  hasProfile: !!profile,
  profile: profile || null,
  accessToken: generateAccessToken(user._id),
  refreshToken: generateRefreshToken(user._id),
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
/**
 *
 * @param req
 * @param res
 * @param next
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email is already used
    const exists = await User.findOne({ email });
    if (exists) {
      return sendError(res, 'An account with this email already exists', 409);
    }

    // Generate OTP for email verification
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user (password hashed in pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      emailVerifyOtp: otp,
      emailVerifyOtpExpires: expiry,
    });

    // Send verification email (non-blocking failure — don't break registration)
    try {
      await sendVerificationEmail(email, name, otp);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
      // Continue — user can request resend
    }

    // After registration, fetch full user with hidden fields for OTP comparison
    const profile = null; // New user has no profile yet

    const responseData = buildAuthResponse(user, profile);

    return sendSuccess(
      res,
      responseData,
      'Account created! Please check your email for the verification OTP.',
      201,
    );
  } catch (err) {
    next(err); // Mongoose duplicate key errors are handled by errorHandler
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
/**
 *
 * @param req
 * @param res
 * @param next
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Must select hidden fields explicitly
    const user = await User.findOne({ email }).select('+emailVerifyOtp +emailVerifyOtpExpires');

    if (!user) return sendError(res, 'User not found', 404);
    if (user.isEmailVerified) return sendError(res, 'Email already verified', 400);
    if (!user.emailVerifyOtp || user.emailVerifyOtp !== otp) {
      return sendError(res, 'Invalid OTP. Please try again.', 400);
    }
    if (user.emailVerifyOtpExpires < new Date()) {
      return sendError(res, 'OTP has expired. Please request a new one.', 400);
    }

    // Mark verified, clear OTP fields and resend counters
    user.isEmailVerified = true;
    user.emailVerifyOtp = undefined;
    user.emailVerifyOtpExpires = undefined;
    user.otpResendCount = 0;
    user.otpLastResend = undefined;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, null, 'Email verified successfully! You can now log in.');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
/**
 *
 * @param req
 * @param res
 * @param next
 */
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return sendError(res, 'Email is required', 400);

    const user = await User.findOne({ email }).select('+emailVerifyOtp +emailVerifyOtpExpires');
    if (!user) return sendError(res, 'User not found', 404);
    if (user.isEmailVerified) return sendError(res, 'Email already verified', 400);

    // ── Rate Limiting Logic ──────────────────────────────────────────────────
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Reset count if last resend was over an hour ago
    if (user.otpLastResend && user.otpLastResend < oneHourAgo) {
      user.otpResendCount = 0;
    }

    if (user.otpResendCount >= 3) {
      return sendError(res, 'Too many requests. Please try again after an hour.', 429);
    }

    // ── Generate and Send New OTP ────────────────────────────────────────────
    const otp = generateOTP();
    const expiry = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

    user.emailVerifyOtp = otp;
    user.emailVerifyOtpExpires = expiry;
    user.otpResendCount += 1;
    user.otpLastResend = now;

    await user.save({ validateBeforeSave: false });

    try {
      await sendVerificationEmail(email, user.name, otp);
    } catch (emailErr) {
      console.error('Email resend failed:', emailErr.message);
      return sendError(res, 'Failed to send email. Please try again later.', 500);
    }

    return sendSuccess(res, null, 'A new OTP has been sent to your email.');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Log in user with email & password
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
/**
 *
 * @param req
 * @param res
 * @param next
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Must explicitly select password since it has select: false in schema
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (user.isSuspended) {
      return sendError(res, 'Your account has been suspended. Please contact support.', 403);
    }

    // Fetch associated profile
    const profile = await Profile.findOne({ user: user._id });

    // Generate and store refresh token (for rotation strategy)
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const responseData = buildAuthResponse(user, profile);

    return sendSuccess(res, responseData, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Refresh access token using a valid refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
/**
 *
 * @param req
 * @param res
 * @param next
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: incomingToken } = req.body;

    if (!incomingToken) return sendError(res, 'Refresh token required', 400);

    // Verify the refresh token signature
    const decoded = verifyRefreshToken(incomingToken);

    // Fetch user with stored token for comparison
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== incomingToken) {
      return sendError(res, 'Invalid or expired refresh token. Please log in again.', 401);
    }

    // Issue new tokens (rotation — old refresh token is replaced)
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(
      res,
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      'Token refreshed',
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
/**
 *
 * @param req
 * @param res
 * @param next
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    // Always return success even if user doesn't exist (prevent user enumeration)
    if (!user) {
      return sendSuccess(
        res,
        null,
        'If an account with this email exists, a reset link has been sent.',
      );
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store hashed token in DB (never store plain token)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(email, user.name, resetUrl);
    } catch (emailErr) {
      // Roll back token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return sendError(res, 'Email could not be sent. Please try again.', 500);
    }

    return sendSuccess(
      res,
      null,
      'If an account with this email exists, a reset link has been sent.',
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Reset password using the token from email
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
/**
 *
 * @param req
 * @param res
 * @param next
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the incoming plain token and compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }, // Token must not be expired
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return sendError(res, 'Reset token is invalid or has expired', 400);
    }

    // Set new password and clear reset fields
    user.password = password; // pre-save hook will hash it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined; // Invalidate all sessions
    await user.save();

    return sendSuccess(
      res,
      null,
      'Password reset successful. Please log in with your new password.',
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Log out — invalidate refresh token
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 *
 * @param req
 * @param res
 * @param next
 */
const logoutUser = async (req, res, next) => {
  try {
    // Clear refresh token so it can't be reused
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current authenticated user + profile
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 *
 * @param req
 * @param res
 * @param next
 */
const getMe = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    return sendSuccess(res, {
      user: req.user,
      profile,
      hasProfile: !!profile,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  resendOTP,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  logoutUser,
  getMe,
};
