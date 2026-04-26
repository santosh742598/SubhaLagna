"use strict";

/**
 * @file SubhaLagna v3.1.5 — MasterData Service
 * @description   Handles logic for registering and retrieving master data entries.
 * @author        SubhaLagna Team
 * @version      3.1.5
 */

const MasterData = require('../models/MasterData');

/**
 * Normalizes a string for deduplication logic.
 * E.g., " Brahmin  " -> "brahmin"
 * @param {string} val - The raw string to normalize.
 * @returns {string} - The normalized string.
 */
const normalize = (val) => {
  if (!val) return '';
  return val.trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * Formats a string to Title Case for better display.
 * E.g., "brahmin" -> "Brahmin"
 * @param {string} str - The string to format.
 * @returns {string} - The formatted string in Title Case.
 */
const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Registers a value in the MasterData collection if it doesn't exist.
 * Updates the usage count if it does.
 * @param {string} type - 'caste', 'city', 'state', 'religion', 'motherTongue'
 * @param {string} value - The raw input value
 * @param {string} [group=''] - Optional group (e.g. State name for a City)
 * @returns {Promise<string|null>} - Returns the official value or null.
 */
const registerValue = async (type, value, group = '') => {
  if (!value) return null;

  const normalized = normalize(value);
  if (!normalized) return null;

  try {
    // Find existing entry
    let entry = await MasterData.findOne({ type, lookupKey: normalized });

    if (entry) {
      // Increment usage count
      entry.count += 1;
      // Update group if provided and missing
      if (group && !entry.group) entry.group = group;
      await entry.save();
      return entry.value; // Return the "official" value
    }

    // Create new entry
    const newEntry = await MasterData.create({
      type,
      value: toTitleCase(value),
      lookupKey: normalized,
      group: group || '',
      count: 1,
      isApproved: true,
    });

    return newEntry.value;
  } catch (err) {
    console.error(`MasterData Error [${type}]:`, err.message);
    return value; // Fallback to raw value on error
  }
};

/**
 * Fetches unique values for a given type.
 * @param {string} type - The type of data to fetch (e.g., 'caste', 'city').
 * @param {string} [group=null] - Optional group filter.
 * @returns {Promise<Array>} - Array of option objects.
 */
const getOptions = async (type, group = null) => {
  const query = { type };
  if (group) query.group = group;

  return MasterData.find(query).sort({ value: 1 }).select('value group -_id').lean();
};

module.exports = {
  registerValue,
  getOptions,
  normalize,
};
