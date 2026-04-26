"use strict";

/**
 * @file SubhaLagna v3.3.6 — Payment Model
 * @description   Tracks all financial transactions on the platform, including
 *                Razorpay, manual admin upgrades, and pending bank transfers.
 * @author        SubhaLagna Team
 * @version      3.3.6
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planId: {
      type: String,
      required: true,
      enum: ['gold', 'platinum'],
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    // Razorpay Specific
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    // Bank Transfer Specific
    utrNumber: {
      type: String,
      trim: true,
    },
    senderUpiId: {
      type: String,
      trim: true,
    },
    paymentDateTime: {
      type: Date,
    },
    userRemarks: {
      type: String,
      trim: true,
    },
    adminRemarks: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['created', 'captured', 'failed', 'refunded', 'manual', 'pending'],
      default: 'created',
    },
    type: {
      type: String,
      enum: ['razorpay', 'manual', 'bank_transfer'],
      required: true,
      default: 'razorpay',
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for fast revenue calculation
paymentSchema.index({ createdAt: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ utrNumber: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
