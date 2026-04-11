/**
 * @fileoverview SubhaLagna v2.3.0 — Admin Controller
 * @description   Admin-only operations for platform management.
 *                All routes require role=admin (enforced by adminOnly middleware).
 *                Endpoints:
 *                  - getDashboardStats → platform-wide aggregated stats
 *                  - getAllUsers        → paginated user list
 *                  - suspendUser       → toggle user suspension
 *                  - verifyProfile     → manually approve/verify a profile
 *                  - deleteUser        → hard delete a user + profile
 *
 * @author        SubhaLagna Team
 * @version 2.3.0
 */

'use strict';

const User         = require('../models/User');
const Profile      = require('../models/Profile');
const Interest     = require('../models/Interest');
const Message      = require('../models/Message');
const Notification = require('../models/Notification');
const Coupon       = require('../models/Coupon');
const Payment      = require('../models/Payment');
const MembershipPlan = require('../models/MembershipPlan');
const { upgradeUserSubscription } = require('./paymentController');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get platform dashboard statistics
// @route   GET /api/admin/stats
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProfiles,
      totalInterests,
      acceptedInterests,
      totalMessages,
      premiumUsers,
      verifiedProfiles,
      recentUsers,
      totalRevenue,
      todayRevenue,
    ] = await Promise.all([
      User.countDocuments({}),
      Profile.countDocuments({}),
      Interest.countDocuments({}),
      Interest.countDocuments({ status: 'accepted' }),
      Message.countDocuments({}),
      User.countDocuments({ isPremium: true }),
      Profile.countDocuments({ isVerified: true }),
      User.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt isPremium'),
      Payment.aggregate([
        { $match: { status: { $in: ['captured', 'manual'] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            status: { $in: ['captured', 'manual'] },
            createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
          } 
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    return sendSuccess(res, {
      totalUsers,
      totalProfiles,
      totalInterests,
      acceptedInterests,
      connectionRate:    totalInterests > 0 ? Math.round((acceptedInterests / totalInterests) * 100) : 0,
      totalMessages,
      premiumUsers,
      freeUsers:         totalUsers - premiumUsers,
      verifiedProfiles,
      recentUsers,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all users (paginated) with optional search
// @route   GET /api/admin/users?page=1&limit=20&search=name
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (search) {
      query.$or = [
        { name:  new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken -resetPasswordToken')
        .populate('profile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return sendPaginated(res, users, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Suspend or unsuspend a user
// @route   PUT /api/admin/users/:id/suspend
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const toggleSuspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    // Prevent admin from suspending themselves
    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 'You cannot suspend your own account', 400);
    }

    user.isSuspended = !user.isSuspended;
    await user.save({ validateBeforeSave: false });

    // Notify the user
    await Notification.create({
      recipient: user._id,
      type:      'system',
      message:   user.isSuspended
        ? 'Your account has been suspended. Contact support for assistance.'
        : 'Your account suspension has been lifted. Welcome back!',
    });

    return sendSuccess(
      res,
      { userId: user._id, isSuspended: user.isSuspended },
      `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully`
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify (or unverify) a user's profile
// @route   PUT /api/admin/profiles/:id/verify
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const toggleVerifyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id).populate('user', 'name');
    if (!profile) return sendError(res, 'Profile not found', 404);

    profile.isVerified = !profile.isVerified;
    await profile.save({ validateBeforeSave: false });

    if (profile.isVerified) {
      await Notification.create({
        recipient: profile.user._id,
        type:      'profile_verified',
        message:   '🎉 Your profile has been verified by SubhaLagna! Your profile now shows a verified badge.',
        link:      '/profile',
      });
    }

    return sendSuccess(
      res,
      { profileId: profile._id, isVerified: profile.isVerified },
      `Profile ${profile.isVerified ? 'verified' : 'unverified'} successfully`
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Hard delete a user and all associated data
// @route   DELETE /api/admin/users/:id
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 'You cannot delete your own admin account', 400);
    }

    // Cascade delete: profile, interests, notifications
    await Promise.all([
      Profile.deleteOne({ user: user._id }),
      Interest.deleteMany({ $or: [{ sender: user._id }, { receiver: user._id }] }),
      Notification.deleteMany({ $or: [{ recipient: user._id }, { sender: user._id }] }),
      User.deleteOne({ _id: user._id }),
    ]);

    return sendSuccess(res, null, 'User and all associated data deleted permanently');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, coupons);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new coupon
// @route   POST /api/admin/coupons
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, expiryDate, minPurchase, maxDiscount, usageLimit } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return sendError(res, 'Coupon code already exists', 400);

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      expiryDate,
      minPurchase,
      maxDiscount,
      usageLimit
    });

    return sendSuccess(res, coupon, 'Coupon created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Coupon deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Manually upgrade user to premium
// @route   POST /api/admin/users/:id/upgrade
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const manualUpgradeUser = async (req, res, next) => {
  try {
    const { planId, durationDays } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + Number(durationDays));

    let contactsAllowed = planId === 'platinum' ? -1 : 30;

    user.isPremium = true;
    user.premiumPlan = planId;
    user.premiumExpires = expiry;
    user.contactsAllowed = contactsAllowed;
    await user.save({ validateBeforeSave: false });

    // Record the manual upgrade as a ₹0 payment for stats tracking
    await Payment.create({
      user: user._id,
      planId,
      amount: 0,
      status: 'manual',
      expiryDate: expiry,
      type: 'manual'
    });

    await Notification.create({
      recipient: user._id,
      type: 'system',
      message: `🎉 Your account has been manually upgraded to ${planId.toUpperCase()} for ${durationDays} days. Enjoy your premium benefits!`,
    });

    return sendSuccess(res, user, `User upgraded to ${planId} successfully`);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all pending bank payments
// @route   GET /api/admin/payments/pending
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const getPendingPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, payments, 'Pending payments retrieved');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify (Approve/Reject) a bank payment
// @route   PUT /api/admin/payments/:id/verify
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const verifyBankPayment = async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body; // status: 'captured' or 'failed'
    
    if (!['captured', 'failed'].includes(status)) {
      return sendError(res, 'Invalid status. Use captured or failed.', 400);
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) return sendError(res, 'Payment record not found', 404);
    if (payment.status !== 'pending') return sendError(res, 'Payment is already processed', 400);

    payment.status = status;
    payment.adminRemarks = adminRemarks;
    await payment.save();

    if (status === 'captured') {
      // Logic from paymentController to upgrade user
      await upgradeUserSubscription(payment.user, payment.planId, null, payment.amount);

      await Notification.create({
        recipient: payment.user,
        type: 'system',
        message: `✅ Your bank payment (UTR: ${payment.utrNumber}) has been verified. Your ${payment.planId.toUpperCase()} subscription is now active!`,
      });
    } else {
      await Notification.create({
        recipient: payment.user,
        type: 'system',
        message: `❌ Your bank payment (UTR: ${payment.utrNumber}) was rejected. Reason: ${adminRemarks || 'Information could not be verified'}.`,
      });
    }

    return sendSuccess(res, payment, `Payment ${status === 'captured' ? 'approved' : 'rejected'} successfully`);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all membership plans (including inactive ones)
// @route   GET /api/admin/plans
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const getAllPlans = async (req, res, next) => {
  try {
    const plans = await MembershipPlan.find({}).sort({ price: 1 });
    return sendSuccess(res, plans);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update a membership plan (price, duration, etc.)
// @route   PUT /api/admin/plans/:id
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await MembershipPlan.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });

    if (!plan) return sendError(res, 'Plan not found', 404);

    return sendSuccess(res, plan, 'Plan updated successfully ✨');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new membership plan
// @route   POST /api/admin/plans
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const createPlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.create(req.body);
    return sendSuccess(res, plan, 'New plan created successfully ✨', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleSuspendUser,
  toggleVerifyProfile,
  deleteUser,
  getAllCoupons,
  createCoupon,
  deleteCoupon,
  manualUpgradeUser,
  getPendingPayments,
  verifyBankPayment,
  getAllPlans,
  updatePlan,
  createPlan
};
