/**
 * @file        SubhaLagna v3.0.5 — Admin Service
 * @description API calls for the admin dashboard including user management and membership controls.
 * - v3.0.4 changes:
 *   - Added updateUserRole API wrapper for admin promotion/demotion.
 * - v2.4.0 changes:
 *   - Added getAllTransactions for comprehensive financial oversight. [v2.4.0]
 * - v2.3.0 changes:
 *   - Added getAdminPlans and updateAdminPlan for real-time membership management.
 * @author SubhaLagna Team
 * @version      3.0.5
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

/**
 * Get all membership plans (for admin management).
 */
export const getAdminPlans = async () => {
  try {
    const { data } = await api.get('/admin/plans');
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to fetch plans');
  }
};

/**
 * Create a new user with profile data (Admin only).
 * @param {object} userData
 */
export const adminAddUser = async (userData) => {
  try {
    const { data } = await api.post('/admin/users', userData);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to create user');
  }
};

/**
 * Update an existing user and their profile (Admin only).
 * @param {string} id
 * @param {object} userData
 */
export const adminUpdateUser = async (id, userData) => {
  try {
    const { data } = await api.put(`/admin/users/${id}`, userData);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to update user');
  }
};

/**
 * Update a membership plan.
 * @param {string} id - Plan ObjectID
 * @param {object} updateData
 */
export const updateAdminPlan = async (id, updateData) => {
  try {
    const { data } = await api.put(`/admin/plans/${id}`, updateData);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to update plan');
  }
};
/**
 * Admin: Upload profile and gallery photos for a user
 */
export const adminUploadPhotos = async (profileId, formData) => {
  try {
    const { data } = await api.post(`/admin/profiles/${profileId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to upload photos');
  }
};

/**
 * Retrieve all transactions (Razorpay & Manual) for the ledger.
 * @returns {Promise<object[]>}
 */
export const getAllTransactions = async () => {
  try {
    const { data } = await api.get('/admin/payments/ledger');
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to fetch transactions');
  }
};

/**
 * Update a user's system role (admin or user).
 * @param {string} id - User ID
 * @param {string} role - New role ('admin' or 'user')
 * @returns {Promise<object>} Updated user info
 */
export const updateUserRole = async (id, role) => {
  try {
    const { data } = await api.put(`/admin/users/${id}/role`, { role });
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to update user role');
  }
};
