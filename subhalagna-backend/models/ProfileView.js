"use strict";

/**
 * @file SubhaLagna v3.1.7 — ProfileView Model
 * @description   Tracks which users have viewed a specific profile.
 *                Used for the "Who Viewed My Profile" premium feature.
 *                Free users see the count; Premium users see the full list.
 *                Documents auto-expire after 60 days via TTL index.
 * @author        SubhaLagna Team
 * @version      3.1.7
 */

const mongoose = require('mongoose');

const profileViewSchema = new mongoose.Schema(
  {
    /** The profile that was viewed */
    profileOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /** The user who viewed the profile */
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /** Metadata for analytics */
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// ── Compound unique index: one view record per viewer-owner pair per day ───────
// We don't want to spam with repeated views from the same user
profileViewSchema.index({ profileOwner: 1, viewer: 1 }, { unique: true });

// ── Query index ───────────────────────────────────────────────────────────────
profileViewSchema.index({ profileOwner: 1, createdAt: -1 });

// ── TTL: Auto-delete view records after 60 days ───────────────────────────────
profileViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

module.exports = mongoose.model('ProfileView', profileViewSchema);
