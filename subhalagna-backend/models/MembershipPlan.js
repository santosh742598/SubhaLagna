/**
 * @fileoverview SubhaLagna v2.3.0 — Membership Plan Model
 * @description   Dynamic schema for subscription tiers. 
 *                Allows admins to customize names, prices, and durations.
 */

const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true, // e.g., 'gold', 'platinum'
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    durationInMonths: {
      type: Number,
      required: true,
      min: [0, 'Duration cannot be negative']
    },
    description: {
      type: String,
      default: ''
    },
    features: [
      {
        text: String,
        included: { type: Boolean, default: true }
      }
    ],
    popular: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
