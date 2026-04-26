/**
 * @file        SubhaLagna v3.1.9 — Interest Service
 * @description API calls for the interest/connection request system.
 * @author       SubhaLagna Team
 * @version      3.1.9
 */

import api, { getErrorMessage } from './api';

/** @typedef {'pending'|'accepted'|'rejected'|'withdrawn'} InterestStatus */

/**
 * Send an interest to another user.
 * @param {string} receiverId - MongoDB ObjectId of the receiver
 * @param {string} [message] - Optional personal message (max 300 chars)
 * @returns {Promise<object>} Created Interest document
 */
export const sendInterest = async (receiverId, message = '') => {
  try {
    // Safety check: Ensure receiverId is a string ID, not a full user object
    const finalId = typeof receiverId === 'object' ? receiverId._id : receiverId;
    const { data } = await api.post('/interests', { receiverId: finalId, message });
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to send interest');
  }
};

/**
 * Accept or reject a received interest.
 * @param {string} interestId - MongoDB ObjectId of the Interest document
 * @param {'accepted'|'rejected'} status - The response status
 * @returns {Promise<object>} Updated interest and potential conversation data
 */
export const respondToInterest = async (interestId, status) => {
  try {
    const { data } = await api.put(`/interests/${interestId}`, { status });
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to respond to interest');
  }
};

/**
 * Get my sent or received interests.
 * @param {'sent'|'received'} type - Filter by sent or received
 * @param {InterestStatus} [status] - Optional status filter
 * @returns {Promise<object[]>} Array of interest objects
 */
export const getMyInterests = async (type = 'received', status) => {
  try {
    const { data } = await api.get('/interests', { params: { type, status } });
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to load interests');
  }
};

/**
 * Withdraw a sent interest (only if pending).
 * @param {string} interestId - Interest ID to withdraw
 * @returns {Promise<void>}
 */
export const withdrawInterest = async (interestId) => {
  try {
    await api.delete(`/interests/${interestId}`);
  } catch (err) {
    throw getErrorMessage(err, 'Failed to withdraw interest');
  }
};

/**
 * Check interest status between current user and another user.
 * @param {string} userId - The other user's MongoDB ObjectId
 * @returns {Promise<object>} Current relationship status and interest data
 */
export const getInterestStatus = async (userId) => {
  try {
    const { data } = await api.get(`/interests/status/${userId}`);
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to check interest status');
  }
};
