/**
 * @file        SubhaLagna v3.2.3 — Global Frontend Configuration
 * @description Centralizes all environment-dependent configuration values.
 *               - v3.0.5 changes:
 *                 - Implemented Smart Config for auto-detection of bahaghara.in vs localhost.
 *                 - Forced HTTPS protocols for production domain stability.
 * @author SubhaLagna Team
 * @version      3.2.3
 */

// ── CORE CONFIGURATION (Change these for different websites) ────────────────
export const PRODUCTION_DOMAIN = 'bahaghara.in';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'SubhaLagna';
export const BRAND_PRIMARY = 'Subha';
export const BRAND_SECONDARY = 'Lagna';
export const WHATSAPP_COUNTRY_CODE = import.meta.env.VITE_WHATSAPP_COUNTRY_CODE || '91';

// ── END CORE CONFIGURATION ──────────────────────────────────────────────────

/**
 * Base URL for all REST API calls.
 * Override with VITE_API_URL env var for staging/production.
 * @type {string}
 */
let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
let socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Smart Config: Detect Environment and set URLs automatically
if (typeof window !== 'undefined') {
  const host = window.location.hostname;

  // 🌍 Production Case
  if (host === PRODUCTION_DOMAIN || host === `www.${PRODUCTION_DOMAIN}`) {
    baseUrl = `https://${PRODUCTION_DOMAIN}`;
    socketUrl = `https://${PRODUCTION_DOMAIN}`;
  } 
  // 💻 Local Development Case
  else if (host === 'localhost' || host === '127.0.0.1') {
    baseUrl = 'http://localhost:5000';
    socketUrl = 'http://localhost:5000';
  }
}

export const API_BASE_URL = baseUrl;

/**
 * WebSocket server URL for Socket.io real-time features.
 * Typically same host as API.
 * @type {string}
 */
export const SOCKET_URL = socketUrl;

/**
 * Application version.
 * @type {string}
 */
export const APP_VERSION = '2.4.0';

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
