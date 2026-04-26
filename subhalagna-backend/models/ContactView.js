"use strict";

/**
 * @file        SubhaLagna v3.4.0 — Contact View Model
 * @description   Tracks which contacts a user has unlocked (premium feature).
 *                Replaces the unbounded `contactsViewed` array on the User model
 *                for better scalability with high-usage Platinum members.
 *                - v3.3.2 changes:
 *                  - Initial creation as part of scalability refactor (P2-13).
 * @author        SubhaLagna Team
 * @version      3.4.0
 */

const mongoose = require('mongoose');

const contactViewSchema = new mongoose.Schema(
  {
    /** The user who unlocked the contact */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /** The profile whose contact was unlocked */
    viewedProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
    },
  },
  {
    timestamps: true, // createdAt = when contact was unlocked
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Prevent duplicate unlocks for the same user-profile pair
contactViewSchema.index({ user: 1, viewedProfile: 1 }, { unique: true });
// Fast lookup: "how many contacts has this user unlocked?"
contactViewSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ContactView', contactViewSchema);
