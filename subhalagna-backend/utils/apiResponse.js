'use strict';

/**
 * @file SubhaLagna v3.3.0 — Centralized API Response Helper
 * @description   Standardizes all API responses across the application.
 *                Every successful response follows { success, data } and
 *                every error follows { success, message } format.
 * @author        SubhaLagna Team
 * @version      3.3.0
 *
 * @example
 * const { sendSuccess, sendError } = require('../utils/apiResponse');
 * sendSuccess(res, data, 'Profile created', 201);
 * sendError(res, 'Not authorized', 403);
 */

/**
 * Send a standardized success response.
 * @param {import('express').Response} res  - Express response object
 * @param {*}      data                     - Payload to send (wrapped in data property)
 * @param {string} [message]                - Human-readable message
 * @param {number} [statusCode]             - HTTP status code (default: 200)
 * @returns {import('express').Response} - The Express response object.
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const payload = { success: true, message };
  if (data !== null && data !== undefined) payload.data = data;
  return res.status(statusCode).json(payload);
};

/**
 * Send a standardized error response.
 * @param {import('express').Response} res  - Express response object
 * @param {string} message                  - Error message for the client
 * @param {number} [statusCode]             - HTTP status code (default: 500)
 * @param {*}      [errors]                 - Optional validation errors array
 * @returns {import('express').Response} - The Express response object.
 */
const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

/**
 * Send a paginated list response.
 * @param {import('express').Response} res - Express response object.
 * @param {Array}  data                    - Array of results for the current page.
 * @param {number} total                   - Total count of results before pagination.
 * @param {number} page                    - Current page number.
 * @param {number} limit                   - Items per page.
 * @param {string} [message]               - Optional success message.
 * @returns {import('express').Response}   - The Express response object.
 */
const sendPaginated = (res, data, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
