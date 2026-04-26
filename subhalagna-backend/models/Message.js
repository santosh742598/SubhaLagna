"use strict";

/**
 * @file SubhaLagna v3.3.8 — Message Model
 * @description   Stores individual chat messages within a Conversation.
 *                Each message belongs to a conversation and has a sender.
 *                Supports read receipts via the `isRead` flag.
 * @author        SubhaLagna Team
 * @version      3.3.8
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    /** The conversation this message belongs to */
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },

    /** The user who sent the message */
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /** Message content (text only; extend for media support later) */
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },

    /**
     * Message type for future extensibility.
     * Currently only 'text' is supported.
     */
    type: {
      type: String,
      enum: ['text', 'image', 'system'],
      default: 'text',
    },

    /** Whether the receiver has read this message */
    isRead: {
      type: Boolean,
      default: false,
    },

    /** When the message was read (for read receipt timestamp) */
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt = message sent time
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Fast retrieval of all messages in a conversation, sorted chronologically
messageSchema.index({ conversation: 1, createdAt: 1 });
// Unread message counts per conversation
messageSchema.index({ conversation: 1, isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);
