/**
 * @fileoverview SubhaLagna v2.3.0 — Profile Model
 * @description   Detailed matrimony profile schema. One profile per user (enforced
 *                by unique index on `user`). Stores biographical, family, career,
 *                personality, and preference data.
 *
 *                New in v2.0.0:
 *                  - privacySettings (photo/contact visibility)
 *                  - horoscope (DOB, time, place for Kundali matching)
 *                  - profileViews count
 *                  - completenessScore (computed on save)
 *
 * @author        SubhaLagna Team
 * @version 2.4.0
 */

'use strict';

const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    // ── Link to User Account ──────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true, // Enforce: one profile per user
    },

    // ── Basic Info ────────────────────────────────────────────────────────────
    name:   { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ['Male', 'Female'] },
    age:    { type: Number, min: 18, max: 80 }, // Now auto-calculated from DOB

    // ── Location ──────────────────────────────────────────────────────────────
    location:    { type: String, default: '' }, // Derived: "City, State"
    currentState: { type: String, default: '' },
    currentCity:  { type: String, default: '' },
    nativeState:  { type: String, default: '' },
    nativeCity:   { type: String, default: '' },

    // ── Religion & Community ──────────────────────────────────────────────────
    religion: { type: String, default: 'Hindu', trim: true },
    caste:    { type: String, default: '', trim: true },
    motherTongue: { type: String, default: '', trim: true },

    // ── Physical & Professional ───────────────────────────────────────────────
    height:     { type: String, default: "5' 5\"" },
    education:  { type: String, default: 'Graduate', trim: true },
    profession: { type: String, default: 'Professional', trim: true },
    bio:        { type: String, default: '', maxlength: [500, 'Bio cannot exceed 500 characters'] },

    // ── Photos ────────────────────────────────────────────────────────────────
    profilePhoto:     { type: String, default: '' },
    additionalPhotos: [{ type: String }],

    // ── Verification ─────────────────────────────────────────────────────────
    isVerified: { type: Boolean, default: false },

    // ── Family Background ─────────────────────────────────────────────────────
    family: {
      fatherName: { type: String, default: '', trim: true },
      motherName: { type: String, default: '', trim: true },
      siblings:   { type: String, default: '0' },
      familyType: { type: String, enum: ['Nuclear', 'Joint'], default: 'Nuclear' },
    },

    // ── Personality & Hobbies ─────────────────────────────────────────────────
    traits:           [{ type: String }],
    interests:        [{ type: String }],
    partnerInterests: { type: String, default: '', maxlength: 500 },

    // ── Partner Preferences ───────────────────────────────────────────────────
    partnerPreferences: {
      minAge:   { type: Number, default: 18 },
      maxAge:   { type: Number, default: 40 },
      location: { type: String, default: 'Any' },
      caste:    { type: String, default: 'Any' },
      religion: { type: String, default: 'Any' },
    },

    // ── Horoscope / Kundali (v2.0.0) ─────────────────────────────────────────
    horoscope: {
      dateOfBirth:  { type: Date,   default: null },
      timeOfBirth:  { type: String, default: '' },
      placeOfBirth: { type: String, default: '' },
      rashi:        { type: String, default: '' }, // Moon sign
      nakshatra:    { type: String, default: '' },
      pada:         { type: Number, enum: [1, 2, 3, 4], default: null }, // Nakshatra quarter
      gotra:        { type: String, default: '' },
      manglik:      { type: String, enum: ['Yes', 'No', 'Unknown'], default: 'Unknown' },
    },

    // ── Privacy Settings (v2.0.0) ────────────────────────────────────────────
    privacySettings: {
      showPhotoTo:    {
        type: String,
        enum: ['everyone', 'interests_only', 'none'],
        default: 'everyone',
      },
      showContactTo:  {
        type: String,
        enum: ['premium_only', 'interests_only', 'none'],
        default: 'premium_only',
      },
      isProfileHidden: { type: Boolean, default: false },
    },

    // ── Analytics (v2.0.0) ───────────────────────────────────────────────────
    profileViews:       { type: Number, default: 0 },
    completenessScore:  { type: Number, default: 0, min: 0, max: 100 },
  },
  {
    timestamps: true,
  }
);

// ── Indexes for fast querying ─────────────────────────────────────────────────
profileSchema.index({ gender: 1 });
profileSchema.index({ religion: 1, caste: 1 });
profileSchema.index({ age: 1 });
profileSchema.index({ currentState: 1 });
profileSchema.index({ 'privacySettings.isProfileHidden': 1 });
profileSchema.index({ completenessScore: -1 });

// ── Pre-save Hook: Compute profile completeness score ─────────────────────────
profileSchema.pre('save', async function () {
  // 1. Auto-calculate Age from DOB if available
  if (this.horoscope?.dateOfBirth) {
    const dob = new Date(this.horoscope.dateOfBirth);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff); 
    this.age = Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // 2. Compute profile completeness score
  let score = 0;
  const w = { // field: weight
    name: 10, bio: 15, profilePhoto: 15, age: 5, religion: 5,
    location: 5, education: 5, profession: 5, height: 5, motherTongue: 5,
    traits: 10, interests: 10, 'family.fatherName': 5, 'horoscope.dateOfBirth': 5,
  };

  if (this.name)              score += w.name;
  if (this.bio?.length > 20)  score += w.bio;
  if (this.profilePhoto && !this.profilePhoto.includes('default')) score += w.profilePhoto;
  if (this.age)               score += w.age;
  if (this.religion)          score += w.religion;
  if (this.location)          score += w.location;
  if (this.education)         score += w.education;
  if (this.profession)        score += w.profession;
  if (this.height)            score += w.height;
  if (this.motherTongue)      score += w.motherTongue;
  if (this.traits?.length)    score += w.traits;
  if (this.interests?.length) score += w.interests;
  if (this.family?.fatherName) score += w['family.fatherName'];
  if (this.horoscope?.dateOfBirth) score += w['horoscope.dateOfBirth'];

  this.completenessScore = Math.min(score, 100);
});

module.exports = mongoose.model('Profile', profileSchema);
