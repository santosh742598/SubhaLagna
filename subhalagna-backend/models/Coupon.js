'use strict';

/**
 * @file SubhaLagna v3.3.3 — Coupon Model
 * @description   Schema for managing discount coupons.
 *                Supports percentage and fixed-amount discounts.
 * @author        SubhaLagna Team
 * @version      3.3.3
 */

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, 'Discount value cannot be negative'],
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 100, // max number of times this coupon can be used
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

/**
 * Check if the coupon is currently valid.
 * @returns {boolean}
 */
couponSchema.methods.isValid = function () {
  const now = new Date();
  return this.isActive && this.usageCount < this.usageLimit && this.expiryDate > now;
};

module.exports = mongoose.model('Coupon', couponSchema);
