"use strict";

/**
 * @file SubhaLagna v3.0.3 — Interest (Connection Request) Model
 * @description   Tracks interest requests sent between users (like Shaadi.com's
 *                "Send Interest" feature). One interest document per sender-receiver pair.
 *                Status transitions: pending → accepted | rejected | withdrawn.
 * @author        SubhaLagna Team
 * @version      3.0.3
 */

const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema(
  {
    /** User who initiated the interest */
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /** User who received the interest */
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /**
     * Current status of the interest request.
     * - pending   → Sent but not yet responded to
     * - accepted  → Receiver accepted (mutual match)
     * - rejected  → Receiver declined
     * - withdrawn → Sender cancelled
     */
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },

    /** Optional personal message sent with the interest */
    message: {
      type: String,
      maxlength: [300, 'Message cannot exceed 300 characters'],
      default: '',
    },

    /** When the receiver responded */
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt = when interest was sent
  },
);

// ── Compound unique index: prevent duplicate interests between same pair ───────
interestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// ── Additional indexes for fast lookups ───────────────────────────────────────
interestSchema.index({ receiver: 1, status: 1 }); // "get my received pending interests"
interestSchema.index({ sender: 1, status: 1 }); // "get my sent interests"

module.exports = mongoose.model('Interest', interestSchema);
