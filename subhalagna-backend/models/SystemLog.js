"use strict";

/**
 * @file        SubhaLagna v3.3.8 — System Log Model
 * @description Stores system events, errors, and audit logs for the Admin Health Center.
 * @author        SubhaLagna Team
 * @version      3.3.8
 */

const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'security'],
      default: 'info',
    },
    source: {
      type: String,
      required: true,
      default: 'backend',
    },
    message: {
      type: String,
      required: true,
    },
    stack: {
      type: String, // Error stack trace if applicable
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Additional info like req.path, user ID, etc.
    },
  },
  { timestamps: true },
);

// Auto-delete logs older than 7 days to save space
systemLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('SystemLog', systemLogSchema);
