/**
 * @fileoverview SubhaLagna v2.0.0 — Profile Controller
 * @description   Manages matrimony profile CRUD operations:
 *                - setupProfile    → create initial profile (onboarding)
 *                - getMatches      → paginated, smart-scored match results
 *                - getProfileById  → single profile with view tracking
 *                - updateProfile   → update own profile (ownership enforced)
 *                - getMyProfile    → convenience route for own profile
 *                - getProfileViews → who viewed my profile (premium feature)
 *
 *                Security fixes in v2.0.0:
 *                  - Ownership check on update (prevents cross-user edits)
 *                  - Photo visibility rules based on privacySettings
 *                  - Smart matching score using matchingAlgorithm.js
 *                  - Pagination on getMatches (prevents full-table scan)
 *
 * @author        SubhaLagna Team
 * @version       2.0.2
 */

'use strict';

const Profile      = require('../models/Profile');
const User         = require('../models/User');
const ProfileView = require('../models/ProfileView');
const Interest      = require('../models/Interest');
const Notification = require('../models/Notification');
const sharp        = require('sharp');
const path         = require('path');
const fs           = require('fs');
const { enrichWithMatchScores } = require('../utils/matchingAlgorithm');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create initial profile (Step 2 onboarding)
// @route   POST /api/profiles/setup
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const setupProfile = async (req, res, next) => {
  try {
    const {
      name, gender, age, location, caste, religion, height,
      education, profession, bio, traits, interests,
      fatherName, motherName, siblings, familyType,
      currentState, currentCity, nativeState, nativeCity,
      partnerInterests,
    } = req.body;

    // ── Age validation (server-side double-check) ─────────────────────────
    if (Number(age) < 18) {
      return sendError(res, 'You must be at least 18 years old.', 400);
    }

    // ── Prevent duplicate profiles ─────────────────────────────────────────
    const existing = await Profile.findOne({ user: req.user._id });
    if (existing) {
      return sendError(res, 'A profile already exists for your account.', 400);
    }

    // ── Handle uploaded photos with Sharp Optimization ───────────────────
    const defaultPhoto = gender === 'Male' ? '/uploads/man.png' : '/uploads/woman.png';
    let profilePhoto   = defaultPhoto;
    let additionalPhotos = [];

    const uploadDir = path.join(__dirname, '..', 'uploads');

    // 1. Process Main Profile Photo (800x800 Square Crop)
    if (req.files?.['profilePhoto']?.[0]) {
      const file = req.files['profilePhoto'][0];
      const filename = `profile-${Date.now()}.webp`;
      const outputPath = path.join(uploadDir, filename);

      await sharp(file.buffer)
        .resize(800, 800, { fit: 'cover' }) // Square crop
        .webp({ quality: 80 })
        .toFile(outputPath);

      profilePhoto = `/uploads/${filename}`;
    }

    // 2. Process Additional Gallery Photos (Max 1200px wide)
    if (req.files?.['additionalPhotos']) {
      for (const file of req.files['additionalPhotos']) {
        const filename = `gallery-${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;
        const outputPath = path.join(uploadDir, filename);

        await sharp(file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputPath);

        additionalPhotos.push(`/uploads/${filename}`);
      }
    }

    // ── Parse comma-separated string arrays from FormData ─────────────────
    const traitsArray    = traits    ? traits.split(',').map((t) => t.trim()).filter(Boolean)    : [];
    const interestsArray = interests ? interests.split(',').map((i) => i.trim()).filter(Boolean) : [];

    // ── Create profile ─────────────────────────────────────────────────────
    const profile = await Profile.create({
      user:     req.user._id,
      name,
      gender,
      age:      Number(age),
      location: location || (currentCity && currentState ? `${currentCity}, ${currentState}` : ''),
      currentState:   currentState || '',
      currentCity:    currentCity  || '',
      nativeState:    nativeState  || '',
      nativeCity:     nativeCity   || '',
      caste:      caste     || '',
      religion:   religion  || 'Hindu',
      height:     height    || "5' 5\"",
      education:  education || 'Graduate',
      profession: profession|| 'Professional',
      bio:        bio       || '',
      profilePhoto,
      additionalPhotos,
      traits:    traitsArray,
      interests: interestsArray,
      family: {
        fatherName: fatherName || '',
        motherName: motherName || '',
        siblings:   siblings   || '0',
        familyType: familyType || 'Nuclear',
      },
      partnerInterests: partnerInterests || '',
    });

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
const getMatches = async (req, res, next) => {
  try {
    const {
      gender, location, minAge, maxAge, caste, religion, education,
      page = 1, limit = 12,
    } = req.query;

    if (!gender) {
      return sendError(res, 'Target gender is required', 400);
    }

    // ── Build dynamic MongoDB query ────────────────────────────────────────
    const query = { gender };

    // Exclude the current user's own profile
    query.user = { $ne: req.user._id };

    // Exclude hidden profiles
    query['privacySettings.isProfileHidden'] = false;

    // Optional filters
    if (location && location !== 'Any') query.currentState = new RegExp(location, 'i');
    if (caste     && caste     !== 'Any') query.caste     = new RegExp(caste,     'i');
    if (religion  && religion  !== 'Any') query.religion  = new RegExp(religion,  'i');
    if (education && education !== 'Any') query.education = new RegExp(education, 'i');

    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = Number(minAge);
      if (maxAge) query.age.$lte = Number(maxAge);
    }

    // ── Pagination ─────────────────────────────────────────────────────────
    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit))); // cap at 50
    const skip     = (pageNum - 1) * limitNum;

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
    let enriched    = enrichWithMatchScores(myProfile, candidates);

    // ── Privacy Shield Logic: Batch Interest Check ─────────────────────────
    const candidateUserIds = candidates.map(c => c.user._id);
    const acceptedInterests = await Interest.find({
      $or: [
        { sender: req.user._id, receiver: { $in: candidateUserIds }, status: 'accepted' },
        { sender: { $in: candidateUserIds }, receiver: req.user._id, status: 'accepted' }
      ]
    }).lean();

    const connectedUserIds = new Set([
      ...acceptedInterests.map(i => i.sender.toString()),
      ...acceptedInterests.map(i => i.receiver.toString())
    ]);

    enriched.forEach(c => {
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
const getProfileById = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .populate('user', 'email name isPremium premiumPlan');

    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    // ── Track profile view ───────────────────────────────────────────────────
    if (profile.user._id.toString() !== req.user._id.toString()) {
      try {
        await ProfileView.findOneAndUpdate(
          { profileOwner: profile.user._id, viewer: req.user._id },
          { viewedAt: new Date() },
          { upsert: true, new: true }
        );
        await Profile.findByIdAndUpdate(req.params.id, { $inc: { profileViews: 1 } });
      } catch (_) {}
    }

    const isOwner = profile.user._id.toString() === req.user._id.toString();

    // ── Privacy Shield Logic: Specific connection check ────────────────────
    const showTo = profile.privacySettings?.showPhotoTo || 'everyone';
    let isPhotoBlurred = false;

    if (!isOwner) {
       if (showTo === 'interests_only') {
          const connection = await Interest.findOne({
             $or: [
                { sender: req.user._id, receiver: profile.user._id, status: 'accepted' },
                { sender: profile.user._id, receiver: req.user._id, status: 'accepted' }
             ]
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

    if (!isOwner && !isPlatinum && !isUnlocked) {
      // Hide contact details
      if (result.user) {
        result.user.email = 'LOCKED';
        result.user.phone = 'LOCKED'; 
      }
      result.isContactUnlocked = false;
    } else {
      result.isContactUnlocked = true;
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

    // Handle profile photo update with Sharp
    if (req.files?.['profilePhoto']?.[0]) {
      const file = req.files['profilePhoto'][0];
      const filename = `profile-${Date.now()}.webp`;
      const outputPath = path.join(path.join(__dirname, '..', 'uploads'), filename);

      await sharp(file.buffer)
        .resize(800, 800, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(outputPath);

      updateData.profilePhoto = `/uploads/${filename}`;
    }

    // Handle gallery photo additions with Sharp
    if (req.files?.['additionalPhotos']) {
      const newPhotos = [];
      const uploadDir = path.join(__dirname, '..', 'uploads');

      for (const file of req.files['additionalPhotos']) {
        const filename = `gallery-${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;
        const outputPath = path.join(uploadDir, filename);

        await sharp(file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputPath);

        newPhotos.push(`/uploads/${filename}`);
      }

      const existing = profile.additionalPhotos || [];
      updateData.additionalPhotos = [...existing, ...newPhotos].slice(0, 6);
    }

    // Handle gallery photo deletions
    if (req.body.removePhotos) {
      const toRemove   = JSON.parse(req.body.removePhotos);
      const remaining  = (updateData.additionalPhotos || profile.additionalPhotos || [])
        .filter((p) => !toRemove.includes(p));
      updateData.additionalPhotos = remaining;
    }

    // Handle nested family object update
    if (req.body.fatherName || req.body.motherName || req.body.siblings || req.body.familyType) {
      updateData.family = {
        ...profile.family,
        fatherName: req.body.fatherName || profile.family?.fatherName,
        motherName: req.body.motherName || profile.family?.motherName,
        siblings:   req.body.siblings   || profile.family?.siblings,
        familyType: req.body.familyType || profile.family?.familyType,
      };
    }

    // Re-derive location string if state/city updated
    if (req.body.currentCity || req.body.currentState) {
      const city  = req.body.currentCity  || profile.currentCity;
      const state = req.body.currentState || profile.currentState;
      updateData.location = `${city}, ${state}`;
    }

    const updated = await Profile.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

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
        return sendError(res, 'You have reached your 30-contact limit. Upgrade to Platinum for unlimited access.', 403);
      }

      user.contactsAllowed -= 1;
      user.contactsViewed.push(profile._id);
      await user.save();

      return sendSuccess(res, { remaining: user.contactsAllowed }, 'Contact unlocked! Quota deducted.');
    }

    return sendError(res, 'Unsupported plan tier', 400);
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
};
