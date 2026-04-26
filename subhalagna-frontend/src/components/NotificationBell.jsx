/**
 * @file        SubhaLagna v3.1.5 — Notification Bell Component
 * @description   Header notification icon with unread badge. Shows a dropdown
 *                with the latest notifications. Integrates with NotificationContext
 *                for real-time updates.
 * @author        SubhaLagna Team
 * @version      3.1.5
 */

import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';

// ── Icon Components ───────────────────────────────────────────────────────────

/**
 * Bell icon SVG
 * @param {object} props Component props
 * @param {string} props.className Optional CSS class
 * @returns {React.ReactElement} The bell icon
 */
const BellIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

/** Notification type to icon + color mapping */
const TYPE_CONFIG = {
  new_interest: { emoji: '💌', color: 'bg-rose-100 text-rose-600' },
  interest_accepted: { emoji: '🎉', color: 'bg-emerald-100 text-emerald-600' },
  interest_rejected: { emoji: '😔', color: 'bg-gray-100 text-gray-500' },
  new_message: { emoji: '💬', color: 'bg-blue-100 text-blue-600' },
  profile_view: { emoji: '👁️', color: 'bg-amber-100 text-amber-600' },
  profile_verified: { emoji: '✅', color: 'bg-emerald-100 text-emerald-600' },
  premium_expiry: { emoji: '⚠️', color: 'bg-orange-100 text-orange-600' },
  system: { emoji: '📢', color: 'bg-purple-100 text-purple-600' },
};

/**
 * NotificationBell — renders the bell icon with badge + dropdown.
 * @returns {React.ReactElement} The notification bell component
 */
const NotificationBell = () => {
  const { notifications, unreadCount, markRead, markAllRead } =
    useContext(NotificationContext);

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Close dropdown when clicking outside ──────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle clicking a notification — marks it read and navigates to its link.
   * @param {object} notification The notification object clicked
   */
  const handleNotificationClick = async (notification) => {
    await markRead(notification._id);
    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  /**
   * Format a relative time string (e.g., "2 minutes ago").
   * @param {string} dateStr - ISO date string
   * @returns {string} The formatted relative time string
   */
  const formatRelativeTime = (dateStr) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition-all"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        id="notification-bell-btn"
      >
        <BellIcon className="w-5 h-5" />
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-100 z-50 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
              {unreadCount > 0 && <p className="text-xs text-gray-400">{unreadCount} unread</p>}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-rose-500 font-semibold hover:text-rose-700 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 ${
                      !notification.isRead ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base ${config.color}`}
                    >
                      {config.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notification.isRead && (
                      <div className="shrink-0 w-2 h-2 rounded-full bg-rose-500 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 text-center">
            <button
              onClick={() => {
                navigate('/notifications');
                setOpen(false);
              }}
              className="text-xs text-rose-500 font-semibold hover:underline"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
