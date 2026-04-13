"use strict";

/**
 * @file SubhaLagna v3.0.3 — Profile Routes
 * @description   Route definitions for profile management.
 *                All routes require authentication.
 *
 * Base path: /api/profiles
 *
 *   POST  /setup         → create initial profile (onboarding)
 *   GET   /              → get paginated matches with filters
 *   GET   /me            → get current user's own profile
 *   GET   /views         → who viewed my profile (premium)
 *   GET   /:id           → get any profile by ID (tracks view)
 *   PUT   /:id           → update own profile (ownership enforced)
 * @author SubhaLagna Team
 * @version      3.0.3
 */

const express = require('express');
const router = express.Router();

const {
  setupProfile,
  getMatches,
  getProfileById,
  updateProfile,
  getMyProfile,
  getProfileViews,
  unlockContact,
  toggleShortlist,
  getShortlistedProfiles,
} = require('../controllers/profileController');

const { protect } = require('../middleware/authMiddleware');
const { uploadProfilePhotos } = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimitMiddleware');
const { profileSetupRules, validate } = require('../middleware/validateMiddleware');

// All profile routes require authentication
router.use(protect);

// ── Specific Action Routes (Must come BEFORE generic :id) ────────────────────
router.get('/me', getMyProfile);
router.get('/views', getProfileViews);
router.get('/shortlisted', getShortlistedProfiles);
router.post('/shortlist/:id', toggleShortlist);

// Onboarding
router.post(
  '/setup',
  uploadLimiter,
  uploadProfilePhotos,
  profileSetupRules,
  validate,
  setupProfile,
);

// Match browsing
router.get('/', getMatches);

// ── Generic Parameterized Routes ─────────────────────────────────────────────
// Get by ID (tracks view)
router.get('/:id', getProfileById);

// Unlock contact (Premium)
router.post('/:id/unlock-contact', unlockContact);

// Update profile (ownership checked in controller)
router.put('/:id', uploadLimiter, uploadProfilePhotos, updateProfile);

module.exports = router;
