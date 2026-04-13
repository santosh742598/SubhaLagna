/**
 * @file        SubhaLagna v3.0.3 — Notification Context
 * @description   Provides real-time notification state to all components.
 *                Combines REST API polling with Socket.io push events for
 *                instant notification delivery.
 *
 *                Usage:
 *                  const { notifications, unreadCount, markRead, markAllRead } =
 *                    useContext(NotificationContext);
 *
 * @author        SubhaLagna Team
 * @version      3.0.3
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import {
  getNotifications,
  markOneRead,
  markAllRead as markAllReadService,
  deleteNotification,
} from '../services/notificationService';

/**
 * @typedef {object} NotificationContextValue
 * @property {object[]} notifications  - Array of notification objects
 * @property {number}   unreadCount    - Count of unread notifications
 * @property {boolean}  loading        - Loading state
 * @property {Function} fetchNotifications - Manually trigger a refresh
 * @property {Function} markRead       - Mark single notification read
 * @property {Function} markAllRead    - Mark all read
 * @property {Function} remove         - Delete a notification
 * @property {Function} addRealtime    - Add a real-time notification (from socket)
 */

export const NotificationContext = createContext(
  /** @type {NotificationContextValue} */ ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    fetchNotifications: () => {},
    markRead: () => {},
    markAllRead: () => {},
    remove: () => {},
    addRealtime: () => {},
  }),
);

/**
 * NotificationProvider — provides notification state globally.
 * Must be inside AuthProvider since it depends on auth state.
 */
export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * Fetch notifications from the API.
   */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { notifications: list, unreadCount: count } = await getNotifications(1, 20);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // Silently fail — notifications are not critical
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch on mount + whenever auth state changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll every 60 seconds (supplemental to Socket.io push)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  /**
   * Mark a single notification as read.
   * Optimistic update before API call.
   *
   * @param {string} id - Notification MongoDB ObjectId
   */
  const markRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await markOneRead(id);
  }, []);

  /**
   * Mark ALL notifications as read.
   */
  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllReadService();
  }, []);

  /**
   * Remove a notification from the list.
   *
   * @param {string} id
   */
  const remove = useCallback(
    async (id) => {
      const wasUnread = notifications.find((n) => n._id === id && !n.isRead);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      await deleteNotification(id);
    },
    [notifications],
  );

  /**
   * Add a real-time notification received from Socket.io.
   * Prepends to list and increments unread count.
   *
   * @param {object} notification - Notification object from server
   */
  const addRealtime = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((c) => c + 1);
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    remove,
    addRealtime,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
