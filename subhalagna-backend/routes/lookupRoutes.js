"use strict";

/**
 * @file SubhaLagna v3.0.5 — MasterData Routes
 * @description   Public endpoints for fetching dynamic dropdown options.
 * @author        SubhaLagna Team
 * @version      3.0.5
 */



const express = require('express');
const router = express.Router();
const { getOptions } = require('../services/masterDataService');
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

module.exports = router;
