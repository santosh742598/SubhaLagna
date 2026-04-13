/**
 * @fileoverview SubhaLagna v3.0.0 — Lookup Service
 * @description   Handles API calls for dynamic master data (Caste, City, etc.)
 */

import { API_BASE_URL } from '../config';

/**
 * Fetches unique options for a given master data type.
 * @param {string} type - 'caste', 'city', 'state', 'religion', 'motherTongue'
 * @param {string} group - Optional group (e.g. State name for a City)
 */
export const fetchLookupOptions = async (type, group = '') => {
  try {
    const url = new URL(`${API_BASE_URL}/api/lookup`);
    url.searchParams.append('type', type);
    if (group) url.searchParams.append('group', group);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (res.ok) {
      return data.data.map((item) => item.value);
    }
    return [];
  } catch (err) {
    console.error(`Lookup Error [${type}]:`, err);
    return [];
  }
};
