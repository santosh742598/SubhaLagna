/**
 * @file        SubhaLagna v3.1.0 — Lookup Service
 * @description Handles API calls for dynamic master data (Caste, City, etc.)
 * @author       SubhaLagna Team
 * @version      3.1.0
 */

import api from './api';

/**
 * Fetches unique options for a given master data type.
 * @param {string} type - 'caste', 'city', 'state', 'religion', 'motherTongue'
 * @param {string} [group] - Optional group (e.g. State name for a City)
 * @returns {Promise<string[]>} Array of option values
 */
export const fetchLookupOptions = async (type, group = '') => {
  try {
    const { data } = await api.get('/lookup', {
      params: { type, group },
    });

    if (data && data.data) {
      return data.data.map((item) => item.value);
    }
    return [];
  } catch (err) {
    console.error(`Lookup Error [${type}]:`, err);
    return [];
  }
};
