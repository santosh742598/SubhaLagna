"use strict";

/**
 * @file        SubhaLagna v3.3.6 — Admin Controller
 * @description   Administrative tools for platform management:
 *                - v3.3.0 changes:
 *                  - Implemented getAnalyticsData for time-series growth tracking (30 days).
 *                  - Added MongoDB aggregation pipelines for user and revenue trends.
 *                - User and Profile moderation (suspend, delete).
 *                - System-wide statistics and matchmaking analytics.
 *                - Dynamic membership plan management (pricing/features).
 *                - [v3.0.4 changes]
 *                - Implemented updateUserRole for administrative promotion and demotion.
 *                - Added self-protection logic to prevent admins from demoting themselves.
 *                - [v3.0.0 changes]
 *                - Upgraded to Version 3.0.0 with automated coding standards.
 *                - Integrated strict JSDoc validation.
 *                - Standardized security checks for admin-only routes.
 *                - Verified Express 5 compatibility for performance data.
 * @author        SubhaLagna Team
 * @version      3.3.6
 */

const User = require('../models/User');
const Profile = require('../models/Profile');
const Interest = require('../models/Interest');
const MembershipPlan = require('../models/MembershipPlan');
const Coupon = require('../models/Coupon');
const sharp = require('sharp');
const storageService = require('../utils/storageService');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const SystemSetting = require('../models/SystemSetting');
const SystemLog = require('../models/SystemLog');
const { upgradeUserSubscription } = require('./paymentController');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

// Utility to escape regex special characters
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get platform dashboard statistics
// @route   GET /api/admin/stats
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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
      User.find({}).sort({ createdAt: -1 }).limit(5).select('name email role createdAt isPremium'),
      Payment.aggregate([
        { $match: { status: { $in: ['captured', 'manual'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: { $in: ['captured', 'manual'] },
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return sendSuccess(res, {
      totalUsers,
      totalProfiles,
      totalInterests,
      acceptedInterests,
      connectionRate:
        totalInterests > 0 ? Math.round((acceptedInterests / totalInterests) * 100) : 0,
      totalMessages,
      premiumUsers,
      freeUsers: totalUsers - premiumUsers,
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
// @desc    Get platform growth analytics (Time-series)
// @route   GET /api/admin/analytics
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Aggregates growth data for users and revenue over the last 30 days.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getAnalyticsData = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [userGrowth, revenueGrowth] = await Promise.all([
      // User Growth by Day
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Revenue Growth by Day
      Payment.aggregate([
        {
          $match: {
            status: { $in: ['captured', 'manual'] },
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Format for Recharts (merge and fill gaps)
    const analytics = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const userDay = userGrowth.find((u) => u._id === dateStr);
      const revDay = revenueGrowth.find((r) => r._id === dateStr);

      analytics.unshift({
        date: dateStr,
        users: userDay ? userDay.count : 0,
        revenue: revDay ? revDay.amount : 0,
      });
    }

    return sendSuccess(res, analytics);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all users (paginated) with optional search
// @route   GET /api/admin/users?page=1&limit=20&search=name
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (search) {
      const safeSearch = escapeRegExp(search);
      query.$or = [{ name: new RegExp(safeSearch, 'i') }, { email: new RegExp(safeSearch, 'i') }];
    }

    if (role && role !== 'all') {
      query.role = role;
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
// @desc    Create a new user with profile data (Admin only)
// @route   POST /api/admin/users
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const createUserWithProfile = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'user',
      isPremium = false,
      premiumPlan = 'none',
      premiumExpires = null,
      profileData = {},
    } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 400);
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return sendError(res, 'A user with this email already exists', 409);
    }

    // 2. Create User (Password hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role,
      isEmailVerified: true, // Admin-created users are pre-verified
      isPremium,
      premiumPlan,
      premiumExpires: premiumExpires ? new Date(premiumExpires) : null,
      contactsAllowed: premiumPlan === 'platinum' ? -1 : premiumPlan === 'gold' ? 30 : 0,
    });

    // 3. Create Profile
    // Extract profile fields from profileData or use defaults
    const profile = await Profile.create({
      user: user._id,
      name: profileData.name || name,
      gender: profileData.gender || 'Male',
      religion: profileData.religion || 'Hindu',
      caste: profileData.caste || '',
      motherTongue: profileData.motherTongue || '',
      location: profileData.location || '',
      currentState: profileData.currentState || '',
      currentCity: profileData.currentCity || '',
      nativeState: profileData.nativeState || '',
      nativeCity: profileData.nativeCity || '',
      education: profileData.education || 'Graduate',
      profession: profileData.profession || 'Professional',
      height: profileData.height || '5\' 5"',
      bio: profileData.bio || '',
      profilePhoto:
        profileData.profilePhoto ||
        (profileData.gender === 'Female' ? '/uploads/woman.png' : '/uploads/man.png'),
      family: {
        fatherName: profileData.family?.fatherName || profileData.fatherName || '',
        motherName: profileData.family?.motherName || profileData.motherName || '',
        siblings: profileData.family?.siblings || profileData.siblings || '0',
        familyType: profileData.family?.familyType || profileData.familyType || 'Nuclear',
      },
      horoscope: {
        dateOfBirth: profileData.horoscope?.dateOfBirth
          ? new Date(profileData.horoscope.dateOfBirth)
          : profileData.dateOfBirth
            ? new Date(profileData.dateOfBirth)
            : null,
        timeOfBirth: profileData.horoscope?.timeOfBirth || profileData.timeOfBirth || '',
        placeOfBirth: profileData.horoscope?.placeOfBirth || profileData.placeOfBirth || '',
        rashi: profileData.horoscope?.rashi || profileData.rashi || '',
        nakshatra: profileData.horoscope?.nakshatra || profileData.nakshatra || '',
        pada: profileData.horoscope?.pada || profileData.pada || null,
        gotra: profileData.horoscope?.gotra || profileData.gotra || '',
        manglik: profileData.horoscope?.manglik || profileData.manglik || 'Unknown',
      },
    });

    return sendSuccess(res, { user, profile }, 'User and profile created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update any user and their profile (Admin only)
// @route   PUT /api/admin/users/:id
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const updateUserAndProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, isPremium, premiumPlan, premiumExpires, profileData } =
      req.body;

    const user = await User.findById(id);
    if (!user) return sendError(res, 'User not found', 404);

    let profile = await Profile.findOne({ user: id });
    const isNewProfile = !profile;

    // 1. Update User Document
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password; // Pre-save hook hashes it
    if (role) user.role = role;

    if (isPremium !== undefined) user.isPremium = isPremium;
    if (premiumPlan) {
      user.premiumPlan = premiumPlan;
      user.contactsAllowed = premiumPlan === 'platinum' ? -1 : premiumPlan === 'gold' ? 30 : 0;
    }
    if (premiumExpires !== undefined) {
      user.premiumExpires = premiumExpires ? new Date(premiumExpires) : null;
    }

    await user.save();

    // 2. Update/Create Profile Document
    if (profileData) {
      // If profile doesn't exist, initialize it
      if (isNewProfile) {
        profile = new Profile({
          user: user._id,
          name: profileData.name || user.name,
          gender: profileData.gender || 'Male', // Default gender if missing
        });
      }

      // Basic Fields
      if (profileData.name !== undefined) profile.name = profileData.name;
      if (profileData.gender !== undefined) profile.gender = profileData.gender;
      if (profileData.religion !== undefined) profile.religion = profileData.religion;
      if (profileData.caste !== undefined) profile.caste = profileData.caste;

      // Location
      if (profileData.currentState !== undefined) profile.currentState = profileData.currentState;
      if (profileData.currentCity !== undefined) profile.currentCity = profileData.currentCity;
      if (profileData.nativeState !== undefined) profile.nativeState = profileData.nativeState;
      if (profileData.nativeCity !== undefined) profile.nativeCity = profileData.nativeCity;

      if (profileData.currentState !== undefined || profileData.currentCity !== undefined) {
        profile.location = `${profileData.currentCity || profile.currentCity}, ${profileData.currentState || profile.currentState}`;
      }

      // Bio & Professional
      if (profileData.education !== undefined) profile.education = profileData.education;
      if (profileData.profession !== undefined) profile.profession = profileData.profession;
      if (profileData.height !== undefined) profile.height = profileData.height;
      if (profileData.motherTongue !== undefined) profile.motherTongue = profileData.motherTongue;
      if (profileData.bio !== undefined) profile.bio = profileData.bio;
      if (profileData.profilePhoto !== undefined) profile.profilePhoto = profileData.profilePhoto;

      // Family Settings
      if (profileData.family) {
        profile.family = {
          ...(profile.family?.toObject() || {}),
          ...profileData.family,
        };
      }

      // Horoscope
      if (profileData.horoscope) {
        profile.horoscope = {
          ...(profile.horoscope?.toObject() || {}),
          ...profileData.horoscope,
          dateOfBirth: profileData.horoscope.dateOfBirth
            ? new Date(profileData.horoscope.dateOfBirth)
            : profile.horoscope?.dateOfBirth,
        };
      }

      // Privacy Settings
      if (profileData.privacySettings) {
        profile.privacySettings = {
          ...(profile.privacySettings?.toObject() || {}),
          ...profileData.privacySettings,
        };
      }

      await profile.save();

      // If we just created the profile, link it to the user
      if (isNewProfile) {
        user.profile = profile._id;
        await user.save({ validateBeforeSave: false }); // Skip password validation if already saved
      }
    }

    return sendSuccess(res, { user, profile }, 'User and profile updated successfully');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Suspend or unsuspend a user
// @route   PUT /api/admin/users/:id/suspend
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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
      type: 'system',
      message: user.isSuspended
        ? 'Your account has been suspended. Contact support for assistance.'
        : 'Your account suspension has been lifted. Welcome back!',
    });

    return sendSuccess(
      res,
      { userId: user._id, isSuspended: user.isSuspended },
      `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully`,
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
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const toggleVerifyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id).populate('user', 'name');
    if (!profile) return sendError(res, 'Profile not found', 404);

    profile.isVerified = !profile.isVerified;
    await profile.save({ validateBeforeSave: false });

    if (profile.isVerified) {
      await Notification.create({
        recipient: profile.user._id,
        type: 'profile_verified',
        message:
          '🎉 Your profile has been verified by SubhaLagna! Your profile now shows a verified badge.',
        link: '/profile',
      });
    }

    return sendSuccess(
      res,
      { profileId: profile._id, isVerified: profile.isVerified },
      `Profile ${profile.isVerified ? 'verified' : 'unverified'} successfully`,
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update user role (Admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return sendError(res, 'Invalid role. Must be user or admin.', 400);
    }

    const user = await User.findById(id);
    if (!user) return sendError(res, 'User not found', 404);

    // Prevent self-demotion
    if (id === req.user._id.toString() && role === 'user') {
      return sendError(res, 'You cannot demote yourself. Safety first!', 400);
    }

    user.role = role;
    await user.save({ validateBeforeSave: false });

    await Notification.create({
      recipient: user._id,
      type: 'system',
      message:
        role === 'admin'
          ? '🛡️ You have been promoted to an Administrator. You now have access to the Admin Dashboard.'
          : 'ℹ️ Your administrative access has been revoked. You are now a standard user.',
    });

    return sendSuccess(res, { userId: user._id, role: user.role }, `User role updated to ${role}`);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Hard delete a user and all associated data
// @route   DELETE /api/admin/users/:id
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, expiryDate, minPurchase, maxDiscount, usageLimit } =
      req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return sendError(res, 'Coupon code already exists', 400);

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      expiryDate,
      minPurchase,
      maxDiscount,
      usageLimit,
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
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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
      type: 'manual',
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
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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

    return sendSuccess(
      res,
      payment,
      `Payment ${status === 'captured' ? 'approved' : 'rejected'} successfully`,
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all membership plans (including inactive ones)
// @route   GET /api/admin/plans
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
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
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await MembershipPlan.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
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
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const createPlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.create(req.body);
    return sendSuccess(res, plan, 'New plan created successfully ✨', 201);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Upload profile photo or gallery photos for any user (Admin only)
// @route   POST /api/admin/profiles/:id/photos
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const uploadUserPhotosAdmin = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return sendError(res, 'Profile not found', 404);

    const updateData = {};

    // 1. Handle Main Profile Photo
    if (req.files?.['profilePhoto']?.[0]) {
      const file = req.files['profilePhoto'][0];
      const filename = `profile-${Date.now()}.webp`;

      const buffer = await sharp(file.buffer)
        .resize(800, 800, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      // Cleanup old photo
      if (
        profile.profilePhoto &&
        !profile.profilePhoto.includes('man.png') &&
        !profile.profilePhoto.includes('woman.png')
      ) {
        await storageService.deleteFile(profile.profilePhoto);
      }

      updateData.profilePhoto = await storageService.uploadBuffer(buffer, filename);
    }

    // 2. Handle Additional Photos (Gallery)
    if (req.files?.['additionalPhotos']) {
      const newPhotos = [];
      for (const file of req.files['additionalPhotos']) {
        const filename = `gallery-${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;
        const buffer = await sharp(file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const photoUrl = await storageService.uploadBuffer(buffer, filename);
        newPhotos.push(photoUrl);
      }
      const existing = profile.additionalPhotos || [];
      updateData.additionalPhotos = [...existing, ...newPhotos].slice(0, 6);
    }

    // 3. Handle Deletions if requested
    if (req.body.removePhotos) {
      const toRemove = JSON.parse(req.body.removePhotos);
      for (const photoUrl of toRemove) {
        await storageService.deleteFile(photoUrl);
      }
      const remaining = (updateData.additionalPhotos || profile.additionalPhotos || []).filter(
        (p) => !toRemove.includes(p),
      );
      updateData.additionalPhotos = remaining;
    }

    Object.assign(profile, updateData);
    await profile.save();

    return sendSuccess(res, profile, 'Photos updated successfully');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all payments (Transaction Ledger)
// @route   GET /api/admin/payments/ledger
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({})
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, payments, 'Transaction ledger retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get global system settings
// @route   GET /api/admin/settings
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getSystemSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne({});
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    return sendSuccess(res, settings, 'System settings retrieved');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update global system settings
// @route   PUT /api/admin/settings
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const updateSystemSettings = async (req, res, next) => {
  try {
    const updateData = req.body;
    let settings = await SystemSetting.findOneAndUpdate({}, updateData, {
      new: true,
      runValidators: true,
      upsert: true,
    });
    return sendSuccess(res, settings, 'System settings updated successfully ✨');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get system health diagnostics and logs
// @route   GET /api/admin/system/health
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Aggregates server diagnostics and recent error logs.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getSystemHealth = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const os = require('os');

    const [logs, settings] = await Promise.all([
      SystemLog.find({}).sort({ createdAt: -1 }).limit(50).lean(),
      SystemSetting.findOne({}),
    ]);

    const health = {
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState,
        dbName: mongoose.connection.name,
      },
      server: {
        uptime: os.uptime(),
        memory: {
          free: os.freemem(),
          total: os.totalmem(),
          usage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
        },
        platform: os.platform(),
        cpuCount: os.cpus().length,
      },
      maintenanceMode: settings?.isMaintenanceMode || false,
      recentLogs: logs,
    };

    return sendSuccess(res, health, 'System health retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  createUserWithProfile,
  updateUserAndProfile,
  uploadUserPhotosAdmin,
  updateUserRole,
  toggleSuspendUser,
  toggleVerifyProfile,
  deleteUser,
  getAllCoupons,
  createCoupon,
  deleteCoupon,
  manualUpgradeUser,
  getPendingPayments,
  verifyBankPayment,
  getAllPayments,
  getAllPlans,
  updatePlan,
  createPlan,
  getSystemSettings,
  updateSystemSettings,
  getAnalyticsData,
  getSystemHealth,
};
