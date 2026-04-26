'use strict';

/**
 * @file SubhaLagna v3.3.0 — Centralized Error Handling Middleware
 * @description   Two middleware functions:
 *                1. `notFound` — catches 404 for unregistered routes
 *                2. `errorHandler` — global error handler for all thrown errors,
 *                   including Mongoose validation errors and JWT errors.
 * @author        SubhaLagna Team
 * @version      3.3.0
 */

/**
 * 404 Not Found Middleware.
 * Converts any request that reaches this point into a proper JSON 404.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global Error Handler Middleware.
 * Must have 4 parameters so Express recognizes it as error middleware.
 * Handles specific error types (Mongoose, JWT) with user-friendly messages.
 * @param {Error}  err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose: Document not found ──────────────────────────────────────────
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found (invalid ID format)';
  }

  // ── Mongoose: Duplicate key (e.g. unique email) ───────────────────────────
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Value'} already exists`;
  }

  // ── Mongoose: Validation error ────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('. ');
  }

  // ── JWT: Token expired ────────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please log in again.';
  }

  // ── JWT: Invalid token ────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  // ── Log in development ────────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.error(`❌ [${statusCode}] ${message}`);
    if (statusCode === 500) console.error(err.stack);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack trace in development to avoid information leakage
    ...(process.env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
