/**
 * @fileoverview SubhaLagna v2.0.0 — Admin Service
 * @description   API calls for the admin dashboard.
 *                All calls require admin privileges.
 * @author        SubhaLagna Team
 * @version       2.0.2
 */

import api, { getErrorMessage } from './api';

/**
 * Get high-level platform statistics (users, revenue, matches).
 * @returns {Promise<object>} Stats object
 */
export const getDashboardStats = async () => {
  try {
    const { data } = await api.get('/admin/stats');
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to fetch dashboard stats');
  }
};

/**
 * Get paginated list of all users.
 * @param {object} params - { page, limit, search, role }
 * @returns {Promise<object>} { users, pagination }
 */
export const getAllUsers = async (params) => {
  try {
    const { data } = await api.get('/admin/users', { params });
    return data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to fetch users');
  }
};

/**
 * Toggle user suspension status.
 * @param {string} id - User ID
 * @returns {Promise<object>} Updated user
 */
export const toggleSuspendUser = async (id) => {
  try {
    const { data } = await api.put(`/admin/users/${id}/suspend`);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to toggle suspension');
  }
};

/**
 * Toggle profile verification status.
 * @param {string} id - Profile ID
 * @returns {Promise<object>} Updated profile
 */
export const toggleVerifyProfile = async (id) => {
  try {
    const { data } = await api.put(`/admin/profiles/${id}/verify`);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to verify profile');
  }
};

/**
 * Delete a user and all associated data.
 * @param {string} id - User ID
 */
export const deleteUser = async (id) => {
  try {
    await api.delete(`/admin/users/${id}`);
  } catch (err) {
    throw getErrorMessage(err, 'Failed to delete user');
  }
};

/**
 * Get all available coupons.
 * @returns {Promise<object[]>}
 */
export const getAllCoupons = async () => {
  try {
    const { data } = await api.get('/admin/coupons');
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to fetch coupons');
  }
};

/**
 * Create a new discount coupon.
 * @param {object} couponData 
 * @returns {Promise<object>}
 */
export const createCoupon = async (couponData) => {
  try {
    const { data } = await api.post('/admin/coupons', couponData);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to create coupon');
  }
};

/**
 * Delete a coupon.
 * @param {string} id 
 */
export const deleteCoupon = async (id) => {
  try {
    await api.delete(`/admin/coupons/${id}`);
  } catch (err) {
    throw getErrorMessage(err, 'Failed to delete coupon');
  }
};

/**
 * Manually upgrade a user to premium.
 * @param {string} userId 
 * @param {object} upgradeData - { planId, durationDays }
 */
export const manualUpgradeUser = async (userId, upgradeData) => {
  try {
    const { data } = await api.post(`/admin/users/${userId}/upgrade`, upgradeData);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to manually upgrade user');
  }
};

/**
 * Get all pending bank transfer requests.
 */
export const getPendingBankPayments = async () => {
  try {
    const { data } = await api.get('/admin/payments/pending');
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to fetch pending payments');
  }
};

/**
 * Verify (Approve/Reject) a bank payment.
 * @param {string} id - Payment ID
 * @param {object} verifyData - { status, adminRemarks }
 */
export const verifyBankPayment = async (id, verifyData) => {
  try {
    const { data } = await api.put(`/admin/payments/${id}/verify`, verifyData);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to verify payment');
  }
};
