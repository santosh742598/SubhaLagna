/**
 * @fileoverview SubhaLagna v2.0.0 — Payment Model
 * @description   Tracks all financial transactions on the platform, both Razorpay 
 *                successes and manual admin upgrades.
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
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['created', 'captured', 'failed', 'refunded', 'manual'],
      default: 'created',
    },
    type: {
      type: String,
      enum: ['razorpay', 'manual'],
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
  }
);

// Indexes for fast revenue calculation
paymentSchema.index({ createdAt: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ user: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
