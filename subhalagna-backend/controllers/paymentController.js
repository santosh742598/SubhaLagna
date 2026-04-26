"use strict";

/**
 * @file        SubhaLagna v3.2.8 — Payment & Subscription Controller
 * @description   Handles Razorpay orders, payment verification, and membership logic:
 *                - Integrated Razorpay order creation and signature verification.
 *                - Automated subscription activation and quota management.
 *                - Automated email notifications on successful payment.
 *                - [v3.0.0 changes]
 *                - Upgraded to Version 3.0.0 with automated coding standards.
 *                - Standardized database plan fetching (MembershipPlan).
 *                - Implemented strict JSDoc validation and security checkpoints.
 *                - Verified audit logging for manual bank transfers.
 * @author        SubhaLagna Team
 * @version      3.2.8
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const MembershipPlan = require('../models/MembershipPlan');
const { sendPaymentSuccessEmail } = require('../utils/emailService');

// Initialize Razorpay
// Note: In a real app, these would come from process.env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder',
});

/**
 * Get available subscription plans.
 * GET /api/payments/plans
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
exports.getPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).lean();
    res.json({ success: true, data: plans });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch plans' });
  }
};

/**
 * Validate a coupon code and return discount details.
 * POST /api/payments/validate-coupon
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
exports.validateCoupon = async (req, res) => {
  const { code, planId } = req.body;

  try {
    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon || !coupon.isValid()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
    }

    const plan = await MembershipPlan.findOne({ planId });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (plan.price * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    // Floor the price at 0
    const finalPrice = Math.max(0, plan.price - discount);

    res.json({
      success: true,
      data: {
        originalPrice: plan.price,
        discountedPrice: finalPrice,
        discountAmount: plan.price - finalPrice,
        couponCode: coupon.code,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a Razorpay Order (or return isFree if amount is 0).
 * POST /api/payments/order
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
exports.createOrder = async (req, res) => {
  const { planId, couponCode } = req.body;

  try {
    const plan = await MembershipPlan.findOne({ planId });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    let finalAmount = plan.price;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon && coupon.isValid()) {
        let discount = 0;
        if (coupon.discountType === 'percentage') {
          discount = (plan.price * coupon.discountValue) / 100;
        } else {
          discount = coupon.discountValue;
        }
        finalAmount = Math.max(0, plan.price - discount);
      }
    }

    // ── Zero Price Flow ──
    if (finalAmount === 0) {
      return res.json({
        success: true,
        isFree: true,
        message: 'Plan is free after discount',
        planId: plan.planId,
      });
    }

    // ── Razorpay Order Flow ──
    const options = {
      amount: Math.round(finalAmount * 100), // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Store order ID on user for verification later
    await User.findByIdAndUpdate(req.user._id, { razorpayOrderId: order.id });

    res.json({
      success: true,
      isFree: false,
      data: order,
    });
  } catch (err) {
    console.error('Razorpay Order Error:', err);
    const errorMsg = err.error ? err.error.description || err.error.code : err.message;
    res.status(500).json({ success: false, message: errorMsg || 'Gateway Error' });
  }
};

/**
 * Verify Razorpay payment signature and upgrade user.
 * POST /api/payments/verify
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, couponCode } =
    req.body;

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder')
    .update(sign.toString())
    .digest('hex');

  if (razorpay_signature === expectedSign) {
    const plan = await MembershipPlan.findOne({ planId });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    let finalAmount = plan.price;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });
      if (coupon) {
        let discount =
          coupon.discountType === 'percentage'
            ? (plan.price * coupon.discountValue) / 100
            : coupon.discountValue;
        finalAmount = Math.max(0, plan.price - discount);
      }
    }

    await upgradeUserSubscription(req.user._id, planId, couponCode, finalAmount, {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
    res.json({ success: true, message: 'Payment verified and subscription activated ✨' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid payment signature' });
  }
};

/**
 * Direct activation for ₹0 plans (bypass Razorpay).
 * POST /api/payments/confirm-free
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
exports.confirmFreeSubscription = async (req, res) => {
  const { planId, couponCode } = req.body;

  try {
    // Re-verify on server that it's actually free
    const plan = await MembershipPlan.findOne({ planId });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

    let discount = 0;
    if (coupon && coupon.isValid()) {
      discount =
        coupon.discountType === 'percentage'
          ? (plan.price * coupon.discountValue) / 100
          : coupon.discountValue;
    }

    if (plan.price - discount > 0) {
      return res.status(400).json({ success: false, message: 'This plan is not free' });
    }

    // finalAmount is 0 for free subscription
    await upgradeUserSubscription(req.user._id, planId, couponCode, 0);
    res.json({ success: true, message: 'Subscription activated for free ✨' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Helper to update user status and expiry and record payment.
 * @param {string} userId - ID of the user to upgrade.
 * @param {string} planId - ID of the membership plan.
 * @param {string} couponCode - Optional coupon code used.
 * @param {number} amount - Final amount paid.
 * @param {object} [razorData={}] - Optional Razorpay payment metadata.
 * @returns {Promise<void>} - A promise that resolves when the upgrade is complete.
 */
const upgradeUserSubscription = async (userId, planId, couponCode, amount, razorData = {}) => {
  const plan = await MembershipPlan.findOne({ planId });
  if (!plan) return;

  const expiry = new Date();
  if (plan.durationInMonths > 0) {
    expiry.setMonth(expiry.getMonth() + plan.durationInMonths);
  } else {
    // 0 duration means 100 years (v2 standard for lifetime)
    expiry.setFullYear(expiry.getFullYear() + 100);
  }

  const contactsAllowed = plan.contactsAllowed || 0;

  // 1. Update User
  await User.findByIdAndUpdate(userId, {
    isPremium: true,
    premiumPlan: planId,
    premiumExpires: expiry,
    contactsAllowed: contactsAllowed,
  });

  // 2. Increment coupon usage if used
  if (couponCode) {
    await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usageCount: 1 } });
  }

  // 3. Record Payment
  await Payment.create({
    user: userId,
    planId: planId,
    amount: amount,
    razorpayOrderId: razorData.orderId,
    razorpayPaymentId: razorData.paymentId,
    status: amount > 0 ? 'captured' : 'manual',
    expiryDate: expiry,
    type: razorData.orderId ? 'razorpay' : 'manual',
  });

  // 4. Send Confirmation Email (v2.4.0)
  try {
    const user = await User.findById(userId);
    if (user && user.email) {
      await sendPaymentSuccessEmail(
        user.email,
        user.name,
        plan.name,
        amount,
        expiry.toLocaleDateString(),
      );
    }
  } catch (emailErr) {
    console.error('Failed to send payment success email:', emailErr);
    // Non-blocking error
  }
};

/**
 * Request a manual bank transfer payment.
 * POST /api/payments/bank-transfer
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
exports.requestBankTransfer = async (req, res) => {
  const { planId, amount, utrNumber, senderUpiId, paymentDateTime, userRemarks } =
    req.body;

  try {
    const plan = await MembershipPlan.findOne({ planId });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // Calculate expiry from DB plan duration
    const expiry = new Date();
    if (plan.durationInMonths > 0) {
      expiry.setMonth(expiry.getMonth() + plan.durationInMonths);
    } else {
      expiry.setFullYear(expiry.getFullYear() + 100);
    }

    const payment = await Payment.create({
      user: req.user._id,
      planId,
      amount,
      utrNumber,
      senderUpiId,
      paymentDateTime: paymentDateTime || new Date(),
      userRemarks,
      status: 'pending',
      type: 'bank_transfer',
      expiryDate: expiry, // Tentative
    });

    res.json({
      success: true,
      message:
        'Payment request submitted! Admin will verify your UTR and activate your plan shortly.',
      data: payment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  ...module.exports,
  upgradeUserSubscription,
};
