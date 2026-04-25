"use strict";

/**
 * @file SubhaLagna v3.0.7 — Notification Model
 * @description   In-app notifications for user activity events such as
 *                new interests received, messages, profile views, and system alerts.
 *                Powers the notification bell in the UI header.
 * @author        SubhaLagna Team
 * @version      3.0.7
 */

const mongoose = require('mongoose');

/** Supported notification types with their display icons (consumed by frontend) */
const NOTIFICATION_TYPES = [
  'new_interest', // Someone sent you an interest
  'interest_accepted', // Your interest was accepted
  'interest_rejected', // Your interest was declined
  'new_message', // New chat message received
  'profile_view', // Someone viewed your profile
  'profile_verified', // Admin verified your profile
  'premium_expiry', // Premium subscription expiring soon
  'system', // General system/admin announcement
];

const notificationSchema = new mongoose.Schema(
  {
    /** The user who receives this notification */
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /** The user who triggered the notification (null for system notifications) */
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /** Categorized notification type */
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },

    /** Short, human-readable notification text */
    message: {
      type: String,
      required: true,
      maxlength: 200,
    },

    /** Optional link to navigate to when notification is clicked */
    link: {
      type: String,
      default: null,
    },

    /** Whether the user has seen this notification */
    isRead: {
      type: Boolean,
      default: false,
    },

    /** When the user read the notification */
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt = when notification was created
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Primary query: "get all unread notifications for user X, newest first"
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Auto-delete notifications older than 30 days (TTL index)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
