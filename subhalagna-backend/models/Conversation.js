/**
 * @file SubhaLagna v3.0.1 — Conversation Model
 * @description   Represents a one-to-one chat conversation between two users.
 *                Only created after a mutual interest is accepted.
 *                Tracks both participants and the last message for preview.
 * @author        SubhaLagna Team
 * @version      3.0.1
 */

'use strict';

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    /**
     * Exactly two participants in the conversation.
     * Stored as a sorted pair to make lookups O(1).
     */
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],

    /** Last message text — used for conversation list preview */
    lastMessage: {
      type: String,
      default: '',
      maxlength: 200,
    },

    /** When the last message was sent — used for sorting conversations */
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    /** Reference to the accepted Interest that unlocked this conversation */
    interest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interest',
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Fast lookup: "find conversation between user A and user B"
conversationSchema.index({ participants: 1 });
// Sort conversations by most recent activity
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
