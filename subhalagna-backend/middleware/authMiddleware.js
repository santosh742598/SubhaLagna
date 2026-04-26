"use strict";

/**
 * @file SubhaLagna v3.4.1 — Auth & Role Middleware
 * @description JWT-based route protection and system maintenance logic.
 *               - v3.3.5 changes:
 *                 - Implemented checkMaintenance with role-based bypass.
 * @author SubhaLagna Team
 * @version      3.4.1
 */

const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const { verifyAccessToken } = require('../utils/generateToken');

/**
 * Protect middleware — verifies the Bearer JWT access token.
 * If valid, attaches the User document to `req.user` and calls next().
 * If invalid or missing, passes a 401 error to the error handler.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
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
    const user = await User.findById(decoded.id).select(
      '-password -refreshToken -resetPasswordToken -resetPasswordExpires',
    );
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
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  const error = new Error('Access denied — admin privileges required');
  error.statusCode = 403;
  next(error);
};

/**
 * Maintenance Check Middleware.
 * Rejects non-admin users if maintenance mode is enabled.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const checkMaintenance = async (req, res, next) => {
  try {
    const settings = await SystemSetting.findOne({}).lean();

    if (settings?.isMaintenanceMode) {
      // 1. Allow Login and Status checks so admins can actually log in
      // Also allow Plans and Public Settings so the app can boot to show maintenance page
      const bypassRoutes = [
        '/api/users/login',
        '/api/users/me',
        '/api/admin/settings',
        '/api/payments/plans',
        '/api/lookup/settings',
      ];
      if (bypassRoutes.some((route) => req.originalUrl.includes(route))) {
        return next();
      }

      // 2. Allow if user is already logged in as Admin
      // Note: We try to decode the token manually here if protect hasn't run yet
      let isAdmin = false;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = verifyAccessToken(token);
          const user = await User.findById(decoded.id).select('role');
          if (user?.role === 'admin') isAdmin = true;
        } catch (e) {
          /* Token invalid, continue to block */
        }
      }

      if (!isAdmin) {
        const error = new Error('The platform is currently under maintenance. Please try again later.');
        error.statusCode = 503; // Service Unavailable
        return next(error);
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect, adminOnly, checkMaintenance };
