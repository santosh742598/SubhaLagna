/**
 * @fileoverview SubhaLagna v3.0.1 — Avatar Utility
 * @description Centralized logic for profile photo selection and fallbacks.
 */

/**
 * Returns the appropriate profile image URL.
 * Falls back to gender-specific placeholders if no profile photo is present.
 *
 * @param {object} profile - The profile object containing profilePhoto, gender, etc.
 * @returns {string} The image URL
 */
export const getProfileAvatar = (profile) => {
  if (!profile) return '/man.png';

  // If we have a valid profile photo, use it
  if (
    profile.profilePhoto &&
    profile.profilePhoto !== '' &&
    profile.profilePhoto !== '/uploads/default-avatar.png'
  ) {
    return profile.profilePhoto;
  }

  // Fallback to gender-specific placeholders
  if (profile.gender === 'Female') {
    return '/woman.png';
  }

  // Default to man.png for Male or unspecified
  return '/man.png';
};
