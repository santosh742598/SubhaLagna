/**
 * @file        SubhaLagna v3.3.0 — Shortlist Service
 * @description API wrappers for managing the user's private shortlist.
 * @author       SubhaLagna Team
 * @version      3.3.0
 */

import api, { getErrorMessage } from './api';

/**
 * Toggles a profile in the user's shortlist (adds if missing, removes if present).
 * @param {string} profileId - The ID of the target profile
 * @returns {Promise<object>} { isShortlisted: boolean, message: string }
 */
export const toggleShortlist = async (profileId) => {
  try {
    const { data } = await api.post(`/profiles/shortlist/${profileId}`);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to toggle shortlist');
  }
};

/**
 * Retrieves the full list of profiles shortlisted by the current user.
 * @returns {Promise<object[]>} List of populated profile objects
 */
export const getShortlistedProfiles = async () => {
  try {
    const { data } = await api.get('/profiles/shortlisted');
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to fetch shortlisted profiles');
  }
};
