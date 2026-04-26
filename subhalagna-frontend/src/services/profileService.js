/**
 * @file        SubhaLagna v3.4.1 — Profile Service
 * @description  All profile-related API calls. Handles FormData for file uploads.
 * @author       SubhaLagna Team
 * @version      3.4.1
 */

import api, { getErrorMessage } from './api';

/**
 * Create the initial matrimony profile (onboarding step 2).
 * @param {FormData} formData - Must include all required profile fields + optional photos
 * @returns {Promise<object>} Created profile document
 */
export const setupProfile = async (formData) => {
  try {
    const { data } = await api.post('/profiles/setup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to create profile');
  }
};

/**
 * Get paginated match results with optional filters and smart scoring.
 * @param {object} params - Search filters
 * @param {string} params.gender - Target gender
 * @param {number} [params.page] - Page number
 * @param {number} [params.limit] - Items per page
 * @param {string} [params.location] - City filter
 * @param {number} [params.minAge] - Minimum age
 * @param {number} [params.maxAge] - Maximum age
 * @param {string} [params.religion] - Religion filter
 * @param {string} [params.education] - Education filter
 * @returns {Promise<object>} API response with data and pagination
 */
export const getMatches = async (params) => {
  try {
    const { data } = await api.get('/profiles', { params });
    return data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to fetch matches');
  }
};

/**
 * Get a single profile by its MongoDB ID.
 * @param {string} id - Profile MongoDB ObjectId
 * @returns {Promise<object>} Profile data
 */
export const getProfileById = async (id) => {
  try {
    const { data } = await api.get(`/profiles/${id}`);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to load profile');
  }
};

/**
 * Get the current user's own profile.
 * @returns {Promise<object>} Profile data
 */
export const getMyProfile = async () => {
  try {
    const { data } = await api.get('/profiles/me');
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to load your profile');
  }
};

/**
 * Update a profile by ID (must be the owner).
 * @param {string} id - Profile MongoDB ObjectId
 * @param {FormData} formData - Fields to update + optional new photos
 * @returns {Promise<object>} Updated profile
 */
export const updateProfile = async (id, formData) => {
  try {
    const { data } = await api.put(`/profiles/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to update profile');
  }
};

/**
 * Get who viewed your profile (premium: full list; free: count only).
 * @returns {Promise<object>} Views and total count
 */
export const getProfileViews = async () => {
  try {
    const { data } = await api.get('/profiles/views');
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to load profile views');
  }
};

/**
 * Unlock contact information for a specific profile (Premium only).
 * @param {string} id - Profile MongoDB ObjectId
 * @returns {Promise<object>} API response
 */
export const unlockContact = async (id) => {
  try {
    const { data } = await api.post(`/profiles/${id}/unlock-contact`);
    return data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to unlock contact info');
  }
};
