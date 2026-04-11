/**
 * @fileoverview SubhaLagna v2.0.0 — Payment & Subscription Controller
 * @description   Handles Razorpay order creation, payment verification, 
 *                and coupon logic. Supports zero-price logic for full discounts.
 * @author        SubhaLagna Team
 * @version       2.0.2
 */

const Razorpay = require('razorpay');
const crypto   = require('crypto');
const User     = require('../models/User');
const Coupon   = require('../models/Coupon');
const Payment  = require('../models/Payment');
const plans    = require('../config/plans');

// Initialize Razorpay
// Note: In a real app, these would come from process.env
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder',
});

/**
 * Get available subscription plans.
 * GET /api/payments/plans
 */
exports.getPlans = (req, res) => {
  res.json({ success: true, data: plans });
};

/**
 * Validate a coupon code and return discount details.
 * POST /api/payments/validate-coupon
 */
exports.validateCoupon = async (req, res) => {
  const { code, planId } = req.body;
  
  try {
    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon || !coupon.isValid()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
    }

    const plan = plans.find(p => p.id === planId);
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
        couponCode: coupon.code
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a Razorpay Order (or return isFree if amount is 0).
 * POST /api/payments/order
 */
exports.createOrder = async (req, res) => {
  const { planId, couponCode } = req.body;

  try {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    let finalAmount = plan.price;
    let couponApplied = null;

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
        couponApplied = coupon;
      }
    }

    // ── Zero Price Flow ──
    if (finalAmount === 0) {
      return res.json({
        success: true,
        isFree: true,
        message: 'Plan is free after discount',
        planId: plan.id
      });
    }

    // ── Razorpay Order Flow ──
    const options = {
      amount:   Math.round(finalAmount * 100), // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt:  `receipt_${Date.now()}`,
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
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Verify Razorpay payment signature and upgrade user.
 * POST /api/payments/verify
 */
exports.verifyPayment = async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    planId,
    couponCode
  } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder')
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Get actual amount paid from Razorpay (if possible) or calculate it
    const plan = plans.find(p => p.id === planId);
    let finalAmount = plan.price;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });
      if (coupon) {
        let discount = coupon.discountType === 'percentage' ? (plan.price * coupon.discountValue) / 100 : coupon.discountValue;
        finalAmount = Math.max(0, plan.price - discount);
      }
    }

    await upgradeUserSubscription(req.user._id, planId, couponCode, finalAmount, {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
    });
    res.json({ success: true, message: "Payment verified and subscription activated ✨" });
  } else {
    res.status(400).json({ success: false, message: "Invalid payment signature" });
  }
};

/**
 * Direct activation for ₹0 plans (bypass Razorpay).
 * POST /api/payments/confirm-free
 */
exports.confirmFreeSubscription = async (req, res) => {
  const { planId, couponCode } = req.body;
  
  try {
    // Re-verify on server that it's actually free
    const plan = plans.find(p => p.id === planId);
    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
    
    let discount = 0;
    if (coupon && coupon.isValid()) {
       discount = coupon.discountType === 'percentage' 
          ? (plan.price * coupon.discountValue) / 100 
          : coupon.discountValue;
    }

    if (plan.price - discount > 0) {
      return res.status(400).json({ success: false, message: 'This plan is not free' });
    }
    
    // finalAmount is 0 for free subscription
    await upgradeUserSubscription(req.user._id, planId, couponCode, 0);
    res.json({ success: true, message: "Subscription activated for free ✨" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Helper to update user status and expiry and record payment.
 */
async function upgradeUserSubscription(userId, planId, couponCode, amount, razorData = {}) {
  const plan = plans.find(p => p.id === planId);
  if (!plan) return;

  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1); // Default to 1 Year

  // Set limits based on plan
  let contactsAllowed = 0;
  if (planId === 'gold') contactsAllowed = 30;
  if (planId === 'platinum') contactsAllowed = -1; // Unlimited

  // 1. Update User
  await User.findByIdAndUpdate(userId, {
    isPremium: true,
    premiumPlan: planId,
    premiumExpires: expiry,
    contactsAllowed: contactsAllowed
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
    type: razorData.orderId ? 'razorpay' : 'manual'
  });
}
