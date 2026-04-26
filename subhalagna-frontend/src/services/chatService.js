/**
 * @file        SubhaLagna v3.1.9 — Chat Service
 * @description REST API calls for the chat/messaging feature.
 *              Real-time delivery uses Socket.io (see ChatContext).
 * @author       SubhaLagna Team
 * @version      3.1.9
 */

import api, { getErrorMessage } from './api';

/**
 * Get all conversations for the logged-in user.
 * @returns {Promise<object[]>} Array of enriched conversation objects
 */
export const getConversations = async () => {
  try {
    const { data } = await api.get('/chat/conversations');
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to load conversations');
  }
};

/**
 * Get paginated messages in a conversation.
 * @param {string} conversationId - MongoDB ObjectId
 * @param {number} [page] - Page number
 * @param {number} [limit] - Messages per page
 * @returns {Promise<object>} API response with data and pagination
 */
export const getMessages = async (conversationId, page = 1, limit = 30) => {
  try {
    const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
    return data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to load messages');
  }
};

/**
 * Send a message to a conversation.
 * @param {string} conversationId - Target conversation ID
 * @param {string} content - Message text content
 * @returns {Promise<object>} The created Message document
 */
export const sendMessage = async (conversationId, content) => {
  try {
    const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to send message');
  }
};

/**
 * Mark all messages in a conversation as read.
 * @param {string} conversationId - Conversation to mark as read
 * @returns {Promise<void>}
 */
export const markConversationRead = async (conversationId) => {
  try {
    await api.put(`/chat/conversations/${conversationId}/read`);
  } catch (err) {
    // Non-critical — fail silently
    console.error('markAsRead failed:', err.message);
  }
};
