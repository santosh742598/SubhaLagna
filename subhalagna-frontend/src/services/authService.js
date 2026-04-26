/**
 * @file        SubhaLagna v3.3.1 — Auth Service
 * @description  All authentication-related API calls. Components should call
 *               these service functions instead of calling fetch/axios directly.
 *               - v2.4.0 changes: Added resendOTP service method.
 * @author       SubhaLagna Team
 * @version      3.3.1
 */

import api, { getErrorMessage } from './api';

/**
 * Register a new user account.
 * @param {object} userData - { name, email, password }
 * @returns {Promise<object>} Response data (accessToken, refreshToken, user info)
 * @throws {string} Error message
 */
export const register = async (userData) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Registration failed');
  }
};

/**
 * Verify email with OTP.
 * @param {object} params - { email, otp }
 * @returns {Promise<object>} API response
 */
export const verifyEmail = async (params) => {
  try {
    const { data } = await api.post('/auth/verify-email', params);
    return data;
  } catch (err) {
    throw getErrorMessage(err, 'Verification failed');
  }
};

/**
 * Resend verification OTP.
 * @param {string} email - Target email
 * @returns {Promise<object>} API response
 */
export const resendOTP = async (email) => {
  try {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to resend OTP');
  }
};

/**
 * Log in with email and password.
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} Response data (accessToken, refreshToken, user info)
 */
export const login = async (credentials) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Login failed');
  }
};

/**
 * Log out — clears server-side refresh token.
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Always clear local storage even if server call fails
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

/**
 * Request password reset email.
 * @param {string} email - Registered email address
 * @returns {Promise<object>} API response
 */
export const forgotPassword = async (email) => {
  try {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  } catch (err) {
    throw getErrorMessage(err, 'Could not send reset email');
  }
};

/**
 * Reset password using the token from email link.
 * @param {string} token - The reset token from email
 * @param {string} password - New password
 * @returns {Promise<object>} API response
 */
export const resetPassword = async (token, password) => {
  try {
    const { data } = await api.post(`/auth/reset-password/${token}`, { password });
    return data;
  } catch (err) {
    throw getErrorMessage(err, 'Password reset failed');
  }
};

/**
 * Fetch the currently authenticated user and their profile.
 * @returns {Promise<object>} The user and profile data
 */
export const getMe = async () => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to load user');
  }
};
