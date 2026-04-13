/**
 * @file SubhaLagna v3.0.0 — MasterData Routes
 * @description   Public endpoints for fetching dynamic dropdown options.
 */

'use strict';

const express = require('express');
const router = express.Router();
const { getOptions } = require('../services/masterDataService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @route   GET /api/lookup?type=caste
 * @description    Get unique options for a master data type
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { type, group } = req.query;
    const options = await getOptions(type, group);
    return sendSuccess(res, options, `Options for ${type} retrieved`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
