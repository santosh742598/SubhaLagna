"use strict";

/**
 * @file SubhaLagna v3.4.1 — Interest Routes
 * @description   Route definitions for the interest/connection request system.
 *
 * Base path: /api/interests
 *
 *   POST   /                   → send an interest
 *   GET    /                   → get my interests (sent or received)
 *   GET    /status/:userId     → check interest status with a specific user
 *   PUT    /:id                → accept or reject a received interest
 *   DELETE /:id                → withdraw a sent interest
 * @author SubhaLagna Team
 * @version      3.4.1
 */

const express = require('express');
const router = express.Router();

const {
  sendInterest,
  respondInterest,
  getMyInterests,
  withdrawInterest,
  getInterestStatus,
} = require('../controllers/interestController');

const { protect } = require('../middleware/authMiddleware');
const { sendInterestRules, validate } = require('../middleware/validateMiddleware');

// All interest routes require authentication
router.use(protect);

router.post('/', sendInterestRules, validate, sendInterest);
router.get('/', getMyInterests);
router.get('/status/:userId', getInterestStatus);
router.put('/:id', respondInterest);
router.delete('/:id', withdrawInterest);

module.exports = router;
