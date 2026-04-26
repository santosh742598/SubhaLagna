"use strict";

/**
 * @file SubhaLagna v3.3.5 — System Controller (Public)
 * @description Publicly accessible endpoints for system configuration (Branding, etc.).
 * @version      3.3.5
 * @author SubhaLagna Team
 */

const SystemSetting = require('../models/SystemSetting');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get public system settings (Branding only)
 * @route   GET /api/lookup/settings
 * @access  Public
 */
const getPublicSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne({}).lean();

    // If no settings exist, return defaults but don't create (lookup should be read-only for DB)
    if (!settings) {
      return sendSuccess(res, {
        appName: 'SubhaLagna',
        brandPrimary: 'Subha',
        brandSecondary: 'Lagna',
        whatsappCountryCode: '91',
        productionDomain: 'bahaghara.in',
      });
    }

    // Filter only safe public fields
    const publicSettings = {
      appName: settings.appName,
      brandPrimary: settings.brandPrimary,
      brandSecondary: settings.brandSecondary,
      whatsappCountryCode: settings.whatsappCountryCode,
      productionDomain: settings.productionDomain,
      supportEmail: settings.supportEmail,
      contactPhone: settings.contactPhone,
    };

    return sendSuccess(res, publicSettings, 'System settings retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicSettings,
};
