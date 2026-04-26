"use strict";

/**
 * @file SubhaLagna v3.2.1 — MasterData Model
 * @description   Stores unique, normalized values for common dropdown fields:
 *                - Caste
 *                - City/State
 *                - Religion
 *                - Mother Tongue
 *                Enables "Smart Learning" and deduplication logic.
 * @author        SubhaLagna Team
 * @version      3.2.1
 */

const mongoose = require('mongoose');

const masterDataSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['caste', 'city', 'state', 'religion', 'motherTongue'],
      index: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    // Normalized version for deduplication (e.g. "brahmin")
    lookupKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    // Optional: grouping cities by state
    group: {
      type: String,
      trim: true,
      default: '',
    },
    count: {
      type: Number,
      default: 1,
    },
    isApproved: {
      type: Boolean,
      default: true, // User requested no approval required
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure uniqueness per type
masterDataSchema.index({ type: 1, lookupKey: 1 }, { unique: true });

module.exports = mongoose.model('MasterData', masterDataSchema);
