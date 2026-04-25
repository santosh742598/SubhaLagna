"use strict";

/**
 * @file SubhaLagna v3.1.0 — Smart Matching Algorithm
 * @description   Computes a weighted compatibility score (0–100) between the
 *                logged-in user's profile and each candidate profile.
 *
 *                Scoring weights:
 *                  - Shared interests   → 25 pts max
 *                  - Shared traits      → 15 pts max
 *                  - Religion match     → 20 pts
 *                  - Caste match        → 10 pts
 *                  - Age proximity      → 15 pts max
 *                  - Location match     → 10 pts
 *                  - Education level    →  5 pts
 *                  Total possible       → 100 pts
 * @author        SubhaLagna Team
 * @version      3.1.0
 */

/**
 * Education tier mapping for partial scoring.
 * Profiles closer in education tier get higher scores.
 */
const EDUCATION_TIERS = {
  'High School': 1,
  Diploma: 2,
  "Bachelor's": 3,
  Graduate: 3,
  "Master's": 4,
  MBA: 4,
  PhD: 5,
};

/**
 * Compute the age proximity score.
 * Age difference of 0-2  → 15 pts
 * Age difference of 3-5  → 10 pts
 * Age difference of 6-10 → 5 pts
 * Otherwise              → 0 pts
 * @param {number} myAge - The age of the primary user (current logged-in user).
 * @param {number} theirAge - The age of the candidate profile being compared.
 * @returns {number} Score 0–15 representing age proximity.
 */
const getAgeScore = (myAge, theirAge) => {
  const diff = Math.abs(Number(myAge) - Number(theirAge));
  if (diff <= 2) return 15;
  if (diff <= 5) return 10;
  if (diff <= 10) return 5;
  return 0;
};

/**
 * Compute the interest overlap score.
 * Based on Jaccard similarity to ensure fairness regardless of total count.
 * @param {string[]} myInterests - Array of interests from the primary user's profile.
 * @param {string[]} theirInterests - Array of interests from the candidate's profile.
 * @returns {number} Score 0–25 representing interest overlap.
 */
const getInterestScore = (myInterests = [], theirInterests = []) => {
  if (!myInterests.length || !theirInterests.length) return 0;
  const setA = new Set(myInterests.map((i) => i.toLowerCase()));
  const setB = new Set(theirInterests.map((i) => i.toLowerCase()));
  const intersection = [...setA].filter((i) => setB.has(i)).length;
  const union = new Set([...setA, ...setB]).size;
  return Math.round((intersection / union) * 25);
};

/**
 * Compute the trait overlap score.
 * @param {string[]} myTraits - Array of traits from the primary user's profile.
 * @param {string[]} theirTraits - Array of traits from the candidate's profile.
 * @returns {number} Score 0–15 representing trait overlap.
 */
const getTraitScore = (myTraits = [], theirTraits = []) => {
  if (!myTraits.length || !theirTraits.length) return 0;
  const setA = new Set(myTraits.map((t) => t.toLowerCase()));
  const setB = new Set(theirTraits.map((t) => t.toLowerCase()));
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return Math.round((intersection / union) * 15);
};

/**
 * Compute education tier proximity score.
 * @param {string} myEdu - Education level name of the primary user.
 * @param {string} theirEdu - Education level name of the candidate user.
 * @returns {number} Score 0–5 representing education compatibility.
 */
const getEducationScore = (myEdu, theirEdu) => {
  const myTier = EDUCATION_TIERS[String(myEdu)] || 3;
  const theirTier = EDUCATION_TIERS[String(theirEdu)] || 3;
  const diff = Math.abs(myTier - theirTier);
  if (diff === 0) return 5;
  if (diff === 1) return 3;
  return 0;
};

/**
 * Compute a full compatibility score for a single candidate profile.
 * @param {object} myProfile       - The logged-in user's profile document
 * @param {object} candidateProfile - A candidate profile document from DB
 * @returns {object} A results object containing score, shared tags, and breakdown.
 */
const computeMatchScore = (myProfile, candidateProfile) => {
  // ── Individual dimension scores ───────────────────────────────────────────
  const interestScore = getInterestScore(myProfile.interests, candidateProfile.interests);
  const traitScore = getTraitScore(myProfile.traits, candidateProfile.traits);
  const religionScore =
    (myProfile.religion || '').toLowerCase() === (candidateProfile.religion || '').toLowerCase()
      ? 20
      : 0;
  const casteScore =
    (myProfile.caste || '').toLowerCase() === (candidateProfile.caste || '').toLowerCase() ? 10 : 0;
  const ageScore = getAgeScore(myProfile.age, candidateProfile.age);
  const locationScore =
    (myProfile.currentState || '').toLowerCase() ===
    (candidateProfile.currentState || '').toLowerCase()
      ? 10
      : 0;
  const educationScore = getEducationScore(myProfile.education, candidateProfile.education);

  const total =
    interestScore +
    traitScore +
    religionScore +
    casteScore +
    ageScore +
    locationScore +
    educationScore;

  // ── Shared items (for UI display) ────────────────────────────────────────
  const myInterestSet = new Set((myProfile.interests || []).map((i) => i.toLowerCase()));
  const myTraitSet = new Set((myProfile.traits || []).map((t) => t.toLowerCase()));

  const sharedInterests = (candidateProfile.interests || []).filter((i) =>
    myInterestSet.has(i.toLowerCase()),
  );
  const sharedTraits = (candidateProfile.traits || []).filter((t) =>
    myTraitSet.has(t.toLowerCase()),
  );

  return {
    compatibilityScore: Math.min(total, 100), // cap at 100
    sharedInterests,
    sharedTraits,
    breakdown: {
      interests: interestScore,
      traits: traitScore,
      religion: religionScore,
      caste: casteScore,
      age: ageScore,
      location: locationScore,
      education: educationScore,
    },
  };
};

/**
 * Enrich an array of candidate profiles with compatibility scores.
 * @param {object}   myProfile    - The current user's profile
 * @param {object[]} candidates   - Array of candidate profiles from DB
 * @returns {object[]} Sorted (desc by score) array of enriched profiles
 */
const enrichWithMatchScores = (myProfile, candidates) => {
  if (!myProfile) return candidates; // No enrichment if user has no profile yet

  const enriched = candidates.map((candidate) => {
    const matchData = computeMatchScore(
      myProfile,
      candidate.toObject ? candidate.toObject() : candidate,
    );
    return { ...(candidate.toObject ? candidate.toObject() : candidate), ...matchData };
  });

  // Sort by compatibility score descending (best match first)
  enriched.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  return enriched;
};

module.exports = { computeMatchScore, enrichWithMatchScores };
