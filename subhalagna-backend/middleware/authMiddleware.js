/**
 * @fileoverview SubhaLagna v2.3.0 — Auth & Role Middleware
 * @description   JWT-based route protection middleware:
 *                - `protect`     → validates access token, injects req.user
 *                - `adminOnly`   → restricts route to users with role=admin
 *                Both are designed to work with the centralized error handler.
 * @author        SubhaLagna Team
 * @version 2.3.0
 */

'use strict';

const User = require('../models/User');
const { verifyAccessToken } = require('../utils/generateToken');

/**
 * Protect middleware — verifies the Bearer JWT access token.
 * If valid, attaches the User document to `req.user` and calls next().
 * If invalid or missing, passes a 401 error to the error handler.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check header presence and Bearer prefix
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Not authorized — no token provided');
      error.statusCode = 401;
      return next(error);
    }

    const token = authHeader.split(' ')[1];

    // Verify token (throws on expiry / invalid signature)
    const decoded = verifyAccessToken(token);

    // Fetch user (excluding password) — ensures the user still exists
    const user = await User.findById(decoded.id).select('-password -refreshToken -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      const error = new Error('Not authorized — user account not found');
      error.statusCode = 401;
      return next(error);
    }

    // Check if account is active (not suspended by admin)
    if (user.isSuspended) {
      const error = new Error('Your account has been suspended. Contact support.');
      error.statusCode = 403;
      return next(error);
    }

    req.user = user;
    next();
  } catch (err) {
    // JWT errors (TokenExpiredError, JsonWebTokenError) are handled by errorHandler
    next(err);
  }
};

/**
 * Admin-only middleware — must be used AFTER `protect`.
 * Rejects non-admin users with 403 Forbidden.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  const error = new Error('Access denied — admin privileges required');
  error.statusCode = 403;
  next(error);
};

module.exports = { protect, adminOnly };
