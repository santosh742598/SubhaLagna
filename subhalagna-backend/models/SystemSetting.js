"use strict";

/**
 * @file SubhaLagna v3.3.8 — System Setting Model
 * @description Stores global platform configuration (Branding, WhatsApp, etc.)
 *              editable via Admin Dashboard.
 * @version      3.3.8
 * @author SubhaLagna Team
 */

const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      required: true,
      default: 'SubhaLagna',
      trim: true,
    },
    brandPrimary: {
      type: String,
      required: true,
      default: 'Subha',
      trim: true,
    },
    brandSecondary: {
      type: String,
      required: true,
      default: 'Lagna',
      trim: true,
    },
    whatsappCountryCode: {
      type: String,
      required: true,
      default: '91',
      trim: true,
    },
    productionDomain: {
      type: String,
      required: true,
      default: 'bahaghara.in',
      trim: true,
    },
    // Optional: add more settings like contact email, social links, etc.
    supportEmail: {
      type: String,
      default: 'support@subhalagna.com',
    },
    contactPhone: {
      type: String,
      default: '+91 1234567890',
    },
    officeAddress: {
      type: String,
      default: 'Saheed Nagar, Bhubaneswar 751007, Odisha',
    },
    isMaintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
