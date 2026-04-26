/**
 * @file        SubhaLagna v3.3.2 — Avatar Utility
 * @description Centralized logic for profile photo selection and fallbacks.
 * @author        SubhaLagna Team
 * @version      3.3.2
 */

/**
 * Returns the appropriate profile image URL.
 * Falls back to gender-specific placeholders if no profile photo is present.
 * @param {object} profile - The profile object containing profilePhoto, gender, etc.
 * @returns {string} The image URL
 */
export const getProfileAvatar = (profile) => {
  // Base backend URL for uploaded images
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  if (!profile) return '/man.png';

  // If we have a valid profile photo, use it
  if (
    profile.profilePhoto &&
    profile.profilePhoto !== '' &&
    profile.profilePhoto !== '/uploads/default-avatar.png' &&
    profile.profilePhoto !== '/uploads/default-avatar.jpg'
  ) {
    // If it's already a full URL, return it
    if (profile.profilePhoto.startsWith('http')) return profile.profilePhoto;
    // Otherwise prepend the backend base URL
    return `${API_URL}${profile.profilePhoto}`;
  }

  // Fallback to gender-specific placeholders (.png per server configuration)
  if (profile.gender === 'Female') {
    return '/woman.png';
  }

  // Default to man.png for Male or unspecified
  return '/man.png';
};
