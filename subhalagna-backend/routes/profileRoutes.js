/**
 * @fileoverview SubhaLagna v2.3.0 — Profile Routes
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
 *
 * @author SubhaLagna Team
 * @version 2.3.0
 */

'use strict';

const express = require('express');
const router  = express.Router();

const {
  setupProfile, getMatches, getProfileById,
  updateProfile, getMyProfile, getProfileViews,
  unlockContact,
} = require('../controllers/profileController');

const { protect }                 = require('../middleware/authMiddleware');
const { uploadProfilePhotos }     = require('../middleware/uploadMiddleware');
const { uploadLimiter }           = require('../middleware/rateLimitMiddleware');
const { profileSetupRules, validate } = require('../middleware/validateMiddleware');

// All profile routes require authentication
router.use(protect);

// Own profile routes (must come BEFORE /:id to avoid param capture)
router.get('/me',    getMyProfile);
router.get('/views', getProfileViews);

// Onboarding — create profile
router.post(
  '/setup',
  uploadLimiter,
  uploadProfilePhotos,
  profileSetupRules,
  validate,
  setupProfile
);

// Match browsing with filters + pagination
router.get('/', getMatches);

// Individual profile by ID — also tracks view
router.get('/:id', getProfileById);

// Unlock contact details (Premium)
router.post('/:id/unlock-contact', unlockContact);

// Update own profile — ownership check inside controller
router.put(
  '/:id',
  uploadLimiter,
  uploadProfilePhotos,
  updateProfile
);

module.exports = router;
