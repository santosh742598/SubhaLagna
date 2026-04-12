/**
 * @fileoverview SubhaLagna v2.3.2 — Shortlist Service
 * @description   API wrappers for managing the user's private shortlist.
 */

import { API_BASE_URL } from '../config';

/**
 * Toggles a profile in the user's shortlist (adds if missing, removes if present).
 * 
 * @param {string} profileId - The ID of the target profile
 * @param {string} token - User's authorization token
 * @returns {Promise<object>} { isShortlisted: boolean, message: string }
 */
export const toggleShortlist = async (profileId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profiles/shortlist/${profileId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) throw data.message || 'Failed to toggle shortlist';
    return data.data;
  } catch (err) {
    throw err;
  }
};

/**
 * Retrieves the full list of profiles shortlisted by the current user.
 * 
 * @param {string} token - User's authorization token
 * @returns {Promise<Array>} List of populated profile objects
 */
export const getShortlistedProfiles = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profiles/shortlisted`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) throw data.message || 'Failed to fetch shortlisted profiles';
    return data.data;
  } catch (err) {
    throw err;
  }
};
