"use strict";

/**
 * @file SubhaLagna v3.0.6 — User Model
 * @description   Core user account schema. Stores authentication credentials
 *                and account-level metadata. Profile details are in Profile.js.
 *
 *                Fields added in v2.4.0:
 *                  - otpResendCount, otpLastResend (OTP rate limiting)
 *
 *                Fields added in v2.0.0:
 *                  - isEmailVerified, emailVerifyOtp, emailVerifyOtpExpires
 * @author        SubhaLagna Team
 * @version      3.0.6
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password by default
    },

    // ── Roles & Status ────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },

    // ── Email Verification ────────────────────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyOtp: {
      type: String,
      select: false,
    },
    emailVerifyOtpExpires: {
      type: Date,
      select: false,
    },
    otpResendCount: {
      type: Number,
      default: 0,
    },
    otpLastResend: {
      type: Date,
    },

    // ── Token Management ──────────────────────────────────────────────────────
    /** Stored hashed refresh token for rotation strategy */
    refreshToken: {
      type: String,
      select: false,
    },
    /** Crypto token for password reset (plain; stored as hash in DB) */
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // ── Premium Subscription ──────────────────────────────────────────────────
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumPlan: {
      type: String,
      default: 'none',
    },
    premiumExpires: {
      type: Date,
      default: null,
    },
    /** Razorpay order/payment reference */
    razorpayOrderId: {
      type: String,
      select: false,
    },
    // ── Contact View Tracking (v2.0.0) ──────────────────────────────────────────
    contactsViewed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
      },
    ],
    contactsAllowed: {
      type: Number,
      default: 0, // Will be set to 30 for Gold, -1 for Platinum
    },
    // ── Shortlist Management (v2.3.2) ───────────────────────────────────────
    shortlistedProfiles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
      },
    ],
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ isPremium: 1 });

// ── Pre-save Hook: Hash password ──────────────────────────────────────────────
userSchema.pre('save', async function () {
  // Only re-hash if password was actually modified
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12); // higher rounds than default 10
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance Method: Compare password ────────────────────────────────────────

/**
 * Compare candidate password with stored hash.
 * @param {string} candidatePassword - Plain text password from login form
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if the user's premium subscription is currently active.
 * @returns {boolean}
 */
userSchema.methods.isPremiumActive = function () {
  return this.isPremium && this.premiumExpires && this.premiumExpires > new Date();
};

// ── Virtual: Profile ────────────────────────────────────────────────────────
userSchema.virtual('profile', {
  ref: 'Profile',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

// Ensure virtuals are included in toObject and toJSON transformations
userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
