"use strict";

/**
 * @file        SubhaLagna v3.2.8 — Profile Controller
 * @description   Manages matrimony profile CRUD operations including:
 *                - Comprehensive profile setup (onboarding).
 *                - Paginated matches with Guna Milan scoring.
 *                - Privacy-first photo and contact visibility.
 *                - [v3.0.0 changes]
 *                - Upgraded to Version 3.0.0.
 *                - Standardized security-first coding patterns.
 *                - Implemented strict JSDoc validation and formatting.
 *                - Enhanced data visibility rules for Premium membership tiers.
 * @author        SubhaLagna Team
 * @version      3.2.8
 */

const Profile = require('../models/Profile');
const User = require('../models/User');
const ProfileView = require('../models/ProfileView');
const Interest = require('../models/Interest');
const sharp = require('sharp');
const storageService = require('../utils/storageService');
const { enrichWithMatchScores } = require('../utils/matchingAlgorithm');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { calculateGunaMilan } = require('../utils/gunaMilanService');
const { registerValue } = require('../services/masterDataService');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create initial profile (Step 2 onboarding)
// @route   POST /api/profiles/setup
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const setupProfile = async (req, res, next) => {
  try {
    const {
      name,
      gender,
      location,
      caste,
      religion,
      height,
      education,
      profession,
      bio,
      traits,
      interests,
      fatherName,
      motherName,
      siblings,
      familyType,
      currentState,
      currentCity,
      nativeState,
      nativeCity,
      motherTongue,
      partnerInterests,
      dateOfBirth,
      rashi,
      nakshatra,
      pada,
      gotra,
      manglik,
      phone,
    } = req.body;

    // ── Age validation (server-side double-check) ─────────────────────────
    // Note: age is auto-calculated from dateOfBirth in the model's pre-save hook.
    // We only keep the 18+ check if dob is provided.
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const age = Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970);
      if (age < 18) {
        return sendError(res, 'You must be at least 18 years old.', 400);
      }
    }

    // ── Prevent duplicate profiles ─────────────────────────────────────────
    const existing = await Profile.findOne({ user: req.user._id });
    if (existing) {
      return sendError(res, 'A profile already exists for your account.', 400);
    }

    // ── Handle uploaded photos with Sharp Optimization ───────────────────
    const defaultPhoto = gender === 'Male' ? '/uploads/man.png' : '/uploads/woman.png';
    let profilePhoto = defaultPhoto;
    let additionalPhotos = [];
    // 1. Process Main Profile Photo (800x800 Square Crop)
    if (req.files?.['profilePhoto']?.[0]) {
      const file = req.files['profilePhoto'][0];
      const filename = `profile-${Date.now()}.webp`;

      const buffer = await sharp(file.buffer)
        .resize(800, 800, { fit: 'cover' }) // Square crop
        .webp({ quality: 80 })
        .toBuffer();

      profilePhoto = await storageService.uploadBuffer(buffer, filename);
    }

    if (req.files?.['additionalPhotos']) {
      for (const file of req.files['additionalPhotos']) {
        const filename = `gallery-${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;

        const buffer = await sharp(file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const photoUrl = await storageService.uploadBuffer(buffer, filename);
        additionalPhotos.push(photoUrl);
      }
    }

    // ── Parse comma-separated string arrays from FormData ─────────────────
    const traitsArray = traits
      ? traits
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const interestsArray = interests
      ? interests
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean)
      : [];

    // ── Smart Master Data Registration ───────────────────────────────────
    const [regCaste, regReligion, regMT] = await Promise.all([
      registerValue('caste', caste),
      registerValue('religion', religion),
      registerValue('motherTongue', motherTongue),
    ]);
    // Also register native location
    await Promise.all([
      registerValue('state', nativeState),
      registerValue('city', nativeCity, nativeState),
    ]);

    // ── Create profile ─────────────────────────────────────────────────────
    const profile = await Profile.create({
      user: req.user._id,
      name,
      gender,
      // age:      Number(age), // No longer manually set, handled by DOB hook
      location: location || (currentCity && currentState ? `${currentCity}, ${currentState}` : ''),
      currentState: currentState || '',
      currentCity: currentCity || '',
      nativeState: nativeState || '',
      nativeCity: nativeCity || '',
      caste: regCaste || caste || '',
      religion: regReligion || religion || 'Hindu',
      motherTongue: regMT || motherTongue || '',
      height: height || '5\' 5"',
      education: education || 'Graduate',
      profession: profession || 'Professional',
      bio: bio || '',
      profilePhoto,
      additionalPhotos,
      traits: traitsArray,
      interests: interestsArray,
      family: {
        fatherName: fatherName || '',
        motherName: motherName || '',
        siblings: siblings || '0',
        familyType: familyType || 'Nuclear',
      },
      partnerInterests: partnerInterests || '',
      horoscope: {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        rashi: rashi || '',
        nakshatra: nakshatra || '',
        pada: pada ? Number(pada) : null,
        gotra: gotra || '',
        manglik: manglik || 'Unknown',
      },
    });

    // ── Update User Model with Phone & Name ──────────────────────────────────
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(req.user._id, { name, phone });

    return sendSuccess(res, profile, 'Profile created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get paginated matches with smart scoring
// @route   GET /api/profiles?gender=X&page=1&limit=12&...filters
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getMatches = async (req, res, next) => {
  try {
    const {
      gender,
      location,
      minAge,
      maxAge,
      caste,
      religion,
      education,
      motherTongue,
      manglik,
      profession,
      page = 1,
      limit = 12,
    } = req.query;

    // ── Resolve User Gender ───────────────────────────────────────────────
    // Some users may have gender in User model, others only in Profile.
    let userGender = req.user.gender;
    if (!userGender) {
      const userProfile = await Profile.findOne({ user: req.user._id }).select('gender').lean();
      userGender = userProfile?.gender;
    }

    // ── Strict Gender Enforcement ──────────────────────────────────────────
    let targetGender = gender;
    // Fallback: If no gender provided OR if non-admin is trying to bypass rules
    if (!targetGender || (req.user.role !== 'admin' && targetGender === userGender)) {
      targetGender = userGender === 'Male' ? 'Female' : 'Male';
    }

    // ── Build dynamic MongoDB query ────────────────────────────────────────
    const query = { gender: targetGender };

    // 1. Fetch all admin IDs (for large systems, this should be cached)
    const adminUsers = await User.find({ role: 'admin' }).select('_id').lean();
    const adminIds = adminUsers.map((a) => a._id);

    // 2. Add exclusion to query
    const isProd = process.env.NODE_ENV === 'production';
    query.user = {
      $ne: req.user._id,
    };

    // Only hide admins and incomplete profiles in production
    if (isProd) {
      query.user.$nin = adminIds;
      query.completenessScore = { $gte: 20 };
    }

    // Exclude hidden profiles
    query['privacySettings.isProfileHidden'] = false;

    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Optional filters
    if (location && location !== 'Any') {
      query.currentState = new RegExp(escapeRegExp(location), 'i');
    }
    if (caste && caste !== 'Any') {
      query.caste = new RegExp(escapeRegExp(caste), 'i');
    }
    if (religion && religion !== 'Any') {
      query.religion = new RegExp(escapeRegExp(religion), 'i');
    }
    if (education && education !== 'Any') {
      query.education = new RegExp(escapeRegExp(education), 'i');
    }
    if (motherTongue && motherTongue !== 'Any') {
      query.motherTongue = new RegExp(escapeRegExp(motherTongue), 'i');
    }
    if (profession && profession !== 'Any') {
      query.profession = new RegExp(escapeRegExp(profession), 'i');
    }

    // Horoscope: Manglik
    if (manglik && manglik !== 'Any') {
      query['horoscope.manglik'] = manglik;
    }

    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = Number(minAge);
      if (maxAge) query.age.$lte = Number(maxAge);
    }

    // ── Pagination ─────────────────────────────────────────────────────────
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit))); // cap at 50
    const skip = (pageNum - 1) * limitNum;

    const [candidates, total] = await Promise.all([
      Profile.find(query)
        .populate('user', 'email isPremium premiumPlan')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Profile.countDocuments(query),
    ]);

    // ── Enrich with smart match scores ─────────────────────────────────────
    const myProfile = await Profile.findOne({ user: req.user._id }).lean();
    let enriched = enrichWithMatchScores(myProfile, candidates);

    // ── Privacy Shield Logic: Batch Interest Check ─────────────────────────
    const candidateUserIds = candidates.map((c) => c.user._id);
    const acceptedInterests = await Interest.find({
      $or: [
        { sender: req.user._id, receiver: { $in: candidateUserIds }, status: 'accepted' },
        { sender: { $in: candidateUserIds }, receiver: req.user._id, status: 'accepted' },
      ],
    }).lean();

    const connectedUserIds = new Set([
      ...acceptedInterests.map((i) => i.sender.toString()),
      ...acceptedInterests.map((i) => i.receiver.toString()),
    ]);

    enriched.forEach((c) => {
      const showTo = c.privacySettings?.showPhotoTo || 'everyone';
      const isConnected = connectedUserIds.has(c.user._id.toString());

      if (showTo === 'everyone') {
        c.isPhotoBlurred = false;
      } else if (showTo === 'interests_only') {
        c.isPhotoBlurred = !isConnected;
      } else {
        c.isPhotoBlurred = true;
      }

      // Important: If blurred, don't return additionalPhotos
      if (c.isPhotoBlurred) {
        c.additionalPhotos = [];
      }

      // ── Guna Milan Integration (v2.1.0) ───────────────────────────────────
      const cNak = c.horoscope?.nakshatra || c.nakshatra;
      const cRas = c.horoscope?.rashi || c.rashi;
      const mNak = myProfile?.horoscope?.nakshatra || myProfile?.nakshatra;
      const mRas = myProfile?.horoscope?.rashi || myProfile?.rashi;

      if (mNak && mRas && cNak && cRas) {
        c.gunaMilan = calculateGunaMilan(myProfile, c);
      }
    });

    return sendPaginated(res, enriched, total, pageNum, limitNum, 'Matches retrieved');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single profile by ID (tracks profile view)
// @route   GET /api/profiles/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getProfileById = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id).populate(
      'user',
      'email name isPremium premiumPlan phone',
    );

    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    // ── Track profile view ───────────────────────────────────────────────────
    if (profile.user._id.toString() !== req.user._id.toString()) {
      try {
        await ProfileView.findOneAndUpdate(
          { profileOwner: profile.user._id, viewer: req.user._id },
          { viewedAt: new Date() },
          { upsert: true, new: true },
        );
        await Profile.findByIdAndUpdate(req.params.id, { $inc: { profileViews: 1 } });
      } catch {
        // Silently fail if view tracking fails
      }
    }

    const isOwner = profile.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // ── Privacy Shield Logic: Specific connection check ────────────────────
    const showTo = profile.privacySettings?.showPhotoTo || 'everyone';
    let isPhotoBlurred = false;

    if (!isOwner && !isAdmin) {
      if (showTo === 'interests_only') {
        const connection = await Interest.findOne({
          $or: [
            { sender: req.user._id, receiver: profile.user._id, status: 'accepted' },
            { sender: profile.user._id, receiver: req.user._id, status: 'accepted' },
          ],
        });
        isPhotoBlurred = !connection;
      } else if (showTo === 'none') {
        isPhotoBlurred = true;
      }
    }

    const result = profile.toObject();
    result.isPhotoBlurred = isPhotoBlurred;

    // Redact gallery if blurred
    if (isPhotoBlurred) {
      result.additionalPhotos = [];
    }

    // ── Gating Sensitive Info (Contact Details) ───────────────────────────
    const isPremium = req.user.isPremiumActive ? req.user.isPremiumActive() : req.user.isPremium;
    const isUnlocked = req.user.contactsViewed?.includes(profile._id);
    const isPlatinum = req.user.premiumPlan === 'platinum';

    if (!isOwner && !isPlatinum && !isUnlocked && !isAdmin && !isPremium) {
      // Hide contact details
      if (result.user) {
        result.user.email = 'LOCKED';
        result.user.phone = 'LOCKED';
      }
      result.isContactUnlocked = false;
    } else {
      result.isContactUnlocked = true;
    }

    // ── Guna Milan Integration (v2.1.0) ─────────────────────────────────────
    // Calculate compatibility between viewer and target if both have astrology data
    const myProfile = await Profile.findOne({ user: req.user._id }).lean();

    const targetNak = result.horoscope?.nakshatra || result.nakshatra;
    const targetRas = result.horoscope?.rashi || result.rashi;
    const myNak = myProfile?.horoscope?.nakshatra || myProfile?.nakshatra;
    const myRas = myProfile?.horoscope?.rashi || myProfile?.rashi;

    if (myNak && myRas && targetNak && targetRas) {
      result.gunaMilan = calculateGunaMilan(myProfile, result);
    }

    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update own profile
// @route   PUT /api/profiles/:id
// @access  Private (owner only)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const updateProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    // ── SECURITY: Verify ownership ─────────────────────────────────────────
    if (profile.user.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized to update this profile', 403);
    }

    // ── Build update payload ───────────────────────────────────────────────
    const updateData = { ...req.body };

    // Handle Phone Number update (Sync to User model)
    if (req.body.phone !== undefined || req.body.isWhatsappAvailable !== undefined) {
      const userUpdate = {};
      if (req.body.phone !== undefined) userUpdate.phone = req.body.phone;
      if (req.body.isWhatsappAvailable !== undefined) {
        userUpdate.isWhatsappAvailable = req.body.isWhatsappAvailable === 'true' || req.body.isWhatsappAvailable === true;
      }
      await User.findByIdAndUpdate(profile.user, userUpdate);
    }

    // Handle profile photo update with Sharp
    if (req.files?.['profilePhoto']?.[0]) {
      const file = req.files['profilePhoto'][0];
      const filename = `profile-${Date.now()}.webp`;

      const buffer = await sharp(file.buffer)
        .resize(800, 800, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      // Delete old photo if it exists and isn't a default placeholder
      if (
        profile.profilePhoto &&
        !profile.profilePhoto.includes('man.png') &&
        !profile.profilePhoto.includes('woman.png')
      ) {
        await storageService.deleteFile(profile.profilePhoto);
      }

      updateData.profilePhoto = await storageService.uploadBuffer(buffer, filename);
    }

    // Handle gallery photo additions with Sharp
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

    // Handle gallery photo deletions
    if (req.body.removePhotos) {
      const toRemove = JSON.parse(req.body.removePhotos);

      // Physically delete files from storage
      for (const photoUrl of toRemove) {
        await storageService.deleteFile(photoUrl);
      }

      const remaining = (updateData.additionalPhotos || profile.additionalPhotos || []).filter(
        (p) => !toRemove.includes(p),
      );
      updateData.additionalPhotos = remaining;
    }

    // Handle nested family object update
    if (req.body.fatherName || req.body.motherName || req.body.siblings || req.body.familyType) {
      updateData.family = {
        ...profile.family,
        fatherName: req.body.fatherName || profile.family?.fatherName,
        motherName: req.body.motherName || profile.family?.motherName,
        siblings: req.body.siblings || profile.family?.siblings,
        familyType: req.body.familyType || profile.family?.familyType,
      };
    }

    // Re-derive location string if state/city updated
    if (req.body.currentCity || req.body.currentState) {
      const city = req.body.currentCity || profile.currentCity;
      const state = req.body.currentState || profile.currentState;
      updateData.location = `${city}, ${state}`;
    }

    if (
      req.body.dateOfBirth ||
      req.body.rashi ||
      req.body.nakshatra ||
      req.body.pada ||
      req.body.gotra ||
      req.body.manglik !== undefined
    ) {
      updateData.horoscope = {
        ...profile.horoscope,
        dateOfBirth: req.body.dateOfBirth
          ? new Date(req.body.dateOfBirth)
          : profile.horoscope?.dateOfBirth,
        rashi: req.body.rashi !== undefined ? req.body.rashi : profile.horoscope?.rashi,
        nakshatra:
          req.body.nakshatra !== undefined ? req.body.nakshatra : profile.horoscope?.nakshatra,
        pada: req.body.pada !== undefined ? Number(req.body.pada) : profile.horoscope?.pada,
        gotra: req.body.gotra !== undefined ? req.body.gotra : profile.horoscope?.gotra,
        manglik: req.body.manglik !== undefined ? req.body.manglik : profile.horoscope?.manglik,
      };
    }

    // Handle Privacy Settings Updates
    if (req.body.showPhotoTo || req.body.showContactTo || req.body.isProfileHidden !== undefined) {
      updateData.privacySettings = {
        ...profile.privacySettings,
        showPhotoTo: req.body.showPhotoTo || profile.privacySettings?.showPhotoTo,
        showContactTo: req.body.showContactTo || profile.privacySettings?.showContactTo,
        isProfileHidden:
          req.body.isProfileHidden !== undefined
            ? req.body.isProfileHidden === 'true' || req.body.isProfileHidden === true
            : profile.privacySettings?.isProfileHidden,
      };
    }

    // Handle Partner Preferences Updates
    if (
      req.body.prefMinAge ||
      req.body.prefMaxAge ||
      req.body.prefLocation ||
      req.body.prefCaste ||
      req.body.prefReligion
    ) {
      updateData.partnerPreferences = {
        ...profile.partnerPreferences,
        minAge: req.body.prefMinAge
          ? Number(req.body.prefMinAge)
          : profile.partnerPreferences?.minAge,
        maxAge: req.body.prefMaxAge
          ? Number(req.body.prefMaxAge)
          : profile.partnerPreferences?.maxAge,
        location:
          req.body.prefLocation !== undefined
            ? req.body.prefLocation
            : profile.partnerPreferences?.location,
        caste:
          req.body.prefCaste !== undefined ? req.body.prefCaste : profile.partnerPreferences?.caste,
        religion:
          req.body.prefReligion !== undefined
            ? req.body.prefReligion
            : profile.partnerPreferences?.religion,
      };
    }

    // ── Smart Master Data Registration for Updates ────────────────────────
    if (req.body.caste) updateData.caste = await registerValue('caste', req.body.caste);
    if (req.body.religion) updateData.religion = await registerValue('religion', req.body.religion);
    if (req.body.motherTongue)
      updateData.motherTongue = await registerValue('motherTongue', req.body.motherTongue);

    if (req.body.currentState) await registerValue('state', req.body.currentState);
    if (req.body.currentCity)
      await registerValue(
        'city',
        req.body.currentCity,
        req.body.currentState || profile.currentState,
      );

    if (req.body.nativeState) await registerValue('state', req.body.nativeState);
    if (req.body.nativeCity)
      await registerValue('city', req.body.nativeCity, req.body.nativeState || profile.nativeState);

    // Ensure age is NOT manually updated; it must derive from DOB
    delete updateData.age;

    // ── Apply updates and trigger .save() for hooks ────────────────────────
    Object.assign(profile, updateData);
    const updated = await profile.save();

    return sendSuccess(res, updated, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current user's own profile
// @route   GET /api/profiles/me
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) return sendError(res, 'Profile not found', 404);
    return sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get who viewed my profile (premium feature)
// @route   GET /api/profiles/views
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getProfileViews = async (req, res, next) => {
  try {
    const isPremium = req.user.isPremiumActive ? req.user.isPremiumActive() : req.user.isPremium;

    const views = await ProfileView.find({ profileOwner: req.user._id })
      .populate({
        path: 'viewer',
        select: 'name',
        populate: { path: 'profile', select: 'profilePhoto location', model: 'Profile' },
      })
      .sort({ createdAt: -1 })
      .limit(isPremium ? 100 : 5); // Free users see only count; 5 blurred rows as teaser

    return sendSuccess(res, {
      total: await ProfileView.countDocuments({ profileOwner: req.user._id }),
      views: isPremium ? views : views.map(() => ({ blurred: true })),
      isPremium,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Unlock contact information (Premium feature)
// @route   POST /api/profiles/:id/unlock-contact
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const unlockContact = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return sendError(res, 'Profile not found', 404);

    const user = await User.findById(req.user._id);

    // 1. Owner check
    if (profile.user.toString() === user._id.toString()) {
      return sendSuccess(res, null, 'You already have access to your own contact info');
    }

    // 2. Premium check
    if (!user.isPremiumActive()) {
      return sendError(res, 'Premium subscription required to unlock contacts', 403);
    }

    // 3. Already unlocked check
    if (user.contactsViewed.includes(profile._id.toString())) {
      return sendSuccess(res, null, 'Contact already unlocked');
    }

    // 4. Platinum check (unlimited)
    if (user.premiumPlan === 'platinum') {
      user.contactsViewed.push(profile._id);
      await user.save();
      return sendSuccess(res, null, 'Contact unlocked (Platinum Unlimited)');
    }

    // 5. Gold quota check
    if (user.premiumPlan === 'gold') {
      if (user.contactsAllowed <= 0) {
        return sendError(
          res,
          'You have reached your 30-contact limit. Upgrade to Platinum for unlimited access.',
          403,
        );
      }

      user.contactsAllowed -= 1;
      user.contactsViewed.push(profile._id);
      await user.save();

      return sendSuccess(
        res,
        { remaining: user.contactsAllowed },
        'Contact unlocked! Quota deducted.',
      );
    }

    return sendError(res, 'Unsupported plan tier', 400);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle Shortlist (Add/Remove)
// @route   POST /api/profiles/shortlist/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const toggleShortlist = async (req, res, next) => {
  try {
    const profileId = req.params.id;
    const user = await User.findById(req.user._id);

    if (!user) return sendError(res, 'User not found', 404);

    const isShortlisted = user.shortlistedProfiles.includes(profileId);

    if (isShortlisted) {
      // Remove
      user.shortlistedProfiles = user.shortlistedProfiles.filter(
        (id) => id.toString() !== profileId.toString(),
      );
      await user.save();
      return sendSuccess(res, { isShortlisted: false }, 'Removed from shortlist');
    } else {
      // Add
      user.shortlistedProfiles.push(profileId);
      await user.save();
      return sendSuccess(res, { isShortlisted: true }, 'Added to shortlist');
    }
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all shortlisted profiles
// @route   GET /api/profiles/shortlisted
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getShortlistedProfiles = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'shortlistedProfiles',
      populate: { path: 'user', select: 'name email isPremium premiumPlan' },
    });

    if (!user) return sendError(res, 'User not found', 404);

    return sendSuccess(res, user.shortlistedProfiles, 'Shortlisted profiles retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  setupProfile,
  getMatches,
  getProfileById,
  updateProfile,
  getMyProfile,
  getProfileViews,
  unlockContact,
  toggleShortlist,
  getShortlistedProfiles,
};
