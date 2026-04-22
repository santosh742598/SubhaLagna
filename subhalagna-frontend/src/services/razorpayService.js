/**
 * @file        SubhaLagna v3.0.4 — Razorpay & Bank Payment Integration Service
 * @description Handles Razorpay orders, Bank Transfers, and dynamic plan fetching.
 * - v2.3.0 changes:
 *   - Implemented dynamic plan fetching from the database for checkout selection.
 * @version      3.0.4
 * @author        SubhaLagna Team
 */

import api from './api';

/**
 * Dynamically loads the Razorpay checkout script.
 * @returns {Promise<boolean>}
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Fetch subscription plans from backend.
 */
export const getPlans = async () => {
  const { data } = await api.get('/payments/plans');
  return data.data;
};

/**
 * Validate a coupon code.
 */
export const validateCoupon = async (code, planId) => {
  const { data } = await api.post('/payments/validate-coupon', { code, planId });
  return data.data;
};

/**
 * Create a payment order.
 */
export const createPaymentOrder = async (planId, couponCode) => {
  const { data } = await api.post('/payments/order', { planId, couponCode });
  return data;
};

/**
 * Verify payment signature.
 */
export const verifyPayment = async (paymentData) => {
  const { data } = await api.post('/payments/verify', paymentData);
  return data;
};

/**
 * Confirm subscription for free plans (Skip Razorpay).
 */
export const confirmFreeSubscription = async (planId, couponCode) => {
  const { data } = await api.post('/payments/confirm-free', { planId, couponCode });
  return data;
};

/**
 * Submit bank transfer payment request.
 */
export const requestBankTransfer = async (transferData) => {
  const { data } = await api.post('/payments/bank-transfer', transferData);
  return data;
};
