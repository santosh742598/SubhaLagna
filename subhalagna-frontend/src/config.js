/**
 * @file        SubhaLagna v3.0.2 — Global Frontend Configuration
 * @description Centralizes all environment-dependent configuration values. [v2.4.0]
 * @author SubhaLagna Team
 * @version      3.0.2
 */

/**
 * Base URL for all REST API calls.
 * Override with VITE_API_URL env var for staging/production.
 * @type {string}
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * WebSocket server URL for Socket.io real-time features.
 * Typically same host as API.
 * @type {string}
 */
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Application version.
 * @type {string}
 */
export const APP_VERSION = '2.4.0';

/**
 * App name constant (used across the app for branding).
 * @type {string}
 */
export const APP_NAME = 'SubhaLagna';

/**
 * Razorpay publishable key.
 * Override with VITE_RAZORPAY_KEY_ID for production.
 * @type {string}
 */
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

/**
 * Bank Account details for manual transfers.
 * @type {object}
 */
export const BANK_DETAILS = {
  name: import.meta.env.VITE_BANK_ACC_NAME || 'SubhaLagna Matrimony',
  accNo: import.meta.env.VITE_BANK_ACC_NO || '1234567890',
  ifsc: import.meta.env.VITE_BANK_IFSC || 'SBIN0001234',
  upiId: import.meta.env.VITE_BANK_UPI_ID || 'subhalagna@upi',
};

/**
 * Premium plan pricing (INR).
 * Sync with backend plan definitions.
 * @type {Record<string, number>}
 */
export const PREMIUM_PLANS = {
  gold: 999,
  platinum: 1999,
};
