/**
 * @file        SubhaLagna v3.2.7 — Notification Service
 * @description REST API calls for the in-app notifications system.
 * @author       SubhaLagna Team
 * @version      3.2.7
 */

import api, { getErrorMessage } from './api';

/**
 * Get all notifications for the current user.
 * @param {number} [page] - Page number
 * @param {number} [limit] - Notifications per page
 * @returns {Promise<object>} API response containing notifications and counts
 */
export const getNotifications = async (page = 1, limit = 20) => {
  try {
    const { data } = await api.get('/notifications', { params: { page, limit } });
    return data.data;
  } catch (err) {
    throw getErrorMessage(err, 'Failed to load notifications');
  }
};

/**
 * Mark a single notification as read.
 * @param {string} notificationId - The notification to update
 * @returns {Promise<void>}
 */
export const markOneRead = async (notificationId) => {
  try {
    await api.put(`/notifications/${notificationId}/read`);
  } catch (err) {
    console.error('markOneRead error:', err);
  }
};

/**
 * Mark all notifications as read.
 * @returns {Promise<void>}
 */
export const markAllRead = async () => {
  try {
    await api.put('/notifications/read-all');
  } catch (err) {
    console.error('markAllRead error:', err);
  }
};

/**
 * Delete a notification.
 * @param {string} notificationId - The notification to delete
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    await api.delete(`/notifications/${notificationId}`);
  } catch (err) {
    throw getErrorMessage(err, 'Failed to delete notification');
  }
};
