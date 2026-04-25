"use strict";

/**
 * @file SubhaLagna v3.0.6 — JWT Token Utilities
 * @description   Centralized functions for generating short-lived access tokens
 *                and long-lived refresh tokens. Tokens are verified against
 *                their respective secrets for added security.
 * @author        SubhaLagna Team
 * @version      3.0.6
 */

const jwt = require('jsonwebtoken');

/**
 * Generate a short-lived JWT access token (default: 15 minutes).
 * Used for API request authorization.
 * @param {string} id - MongoDB user ObjectId
 * @returns {string}  Signed JWT access token
 */
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

/**
 * Generate a long-lived JWT refresh token (default: 7 days).
 * Stored in the DB and used to issue new access tokens.
 * @param {string} id - MongoDB user ObjectId
 * @returns {string}  Signed JWT refresh token
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

/**
 * Verify an access token. Throws if invalid or expired.
 * @param {string} token - JWT access token string
 * @returns {{ id: string }} Decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify a refresh token. Throws if invalid or expired.
 * @param {string} token - JWT refresh token string
 * @returns {{ id: string }} Decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
