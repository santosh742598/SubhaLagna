/**
 * @file        SubhaLagna v3.0.5 — Chat Service
 * @description   REST API calls for the chat/messaging feature.
 *                Real-time delivery uses Socket.io (see ChatContext).
 * @author        SubhaLagna Team
 * @version      3.0.5
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
 * @param {number} [page=1]
 * @param {number} [limit=30]
 * @returns {Promise<{ data: object[], pagination: object }>}
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
 * Send a message to a conversation (REST — also triggers socket broadcast server-side).
 * @param {string} conversationId
 * @param {string} content
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
 * @param {string} conversationId
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
