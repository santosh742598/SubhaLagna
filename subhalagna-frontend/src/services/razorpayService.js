/**
 * @fileoverview SubhaLagna v2.0.6 — Razorpay & Bank Payment Integration Service
 * @description   Handles Razorpay SDK loading and backend communication (including Bank Transfers).
 * @version       2.0.2
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
