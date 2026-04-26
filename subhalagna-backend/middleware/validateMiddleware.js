"use strict";

/**
 * @file SubhaLagna v3.3.8 — Input Validation Middleware
 * @description   Express-validator rule sets for all API endpoints.
 *                Provides a reusable `validate` runner that collects errors
 *                and returns a standardized 400 response.
 * @author        SubhaLagna Team
 * @version      3.3.8
 */

const { body, param, validationResult } = require('express-validator');

/**
 * Validation runner middleware.
 * Must be placed AFTER the rule arrays in route definitions.
 * Returns 400 with all validation errors if any exist.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth Validation Rules ─────────────────────────────────────────────────────

/** Rules for POST /api/auth/register */
const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be 2–60 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

/** Rules for POST /api/auth/login */
const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),

  body('password').notEmpty().withMessage('Password is required'),
];

/** Rules for POST /api/auth/forgot-password */
const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),
];

/** Rules for POST /api/auth/reset-password */
const resetPasswordRules = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

// ── Profile Validation Rules ──────────────────────────────────────────────────

/** Rules for POST /api/profiles/setup */
const profileSetupRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),

  body('age')
    .notEmpty()
    .withMessage('Age is required')
    .isInt({ min: 18, max: 80 })
    .withMessage('Age must be between 18 and 80'),

  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['Male', 'Female'])
    .withMessage('Gender must be Male or Female'),

  body('religion').trim().isLength({ max: 50 }).withMessage('Religion must be under 50 characters'),

  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
];

// ── Interest Validation Rules ─────────────────────────────────────────────────

/** Rules for POST /api/interests */
const sendInterestRules = [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required')
    .isMongoId()
    .withMessage('Invalid receiver ID format'),
];

// ── Param Validation ──────────────────────────────────────────────────────────

/**
 * Validate :id param is a valid MongoDB ObjectId
 * @param paramName
 */
const mongoIdParam = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  profileSetupRules,
  sendInterestRules,
  mongoIdParam,
};
