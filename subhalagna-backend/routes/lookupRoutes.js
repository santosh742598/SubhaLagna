"use strict";

/**
 * @file SubhaLagna v3.2.0 — MasterData Routes
 * @description   Public endpoints for fetching dynamic dropdown options.
 * @author        SubhaLagna Team
 * @version      3.2.0
 */



const express = require('express');
const router = express.Router();
const { getOptions } = require('../services/masterDataService');
const { getPublicSettings } = require('../controllers/systemController');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get unique options for a master data type.
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

/**
 * Get public system settings (Branding, etc.).
 */
router.get('/settings', getPublicSettings);

module.exports = router;
