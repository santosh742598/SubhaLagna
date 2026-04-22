"use strict";

/**
 * @file SubhaLagna v3.0.4 — Migration Script
 * @description Clears existing "/uploads/default-avatar.png" strings from Profile records
 * to allow the new gender-specific placeholder logic to work correctly.
 * @author        SubhaLagna Team
 * @version      3.0.4
 */

const mongoose = require('mongoose');
const Profile = require('../models/Profile');
require('dotenv').config();

const clearLegacyAvatars = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('connected to MongoDB');

    const result = await Profile.updateMany(
      { profilePhoto: '/uploads/default-avatar.png' },
      { $set: { profilePhoto: '' } },
    );

    console.log(`Success: Cleared legacy avatars from ${result.modifiedCount} profiles.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

clearLegacyAvatars();
