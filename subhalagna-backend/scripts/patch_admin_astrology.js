'use strict';

/**
 * @file patch_admin_astrology.js
 * @description Adds sample astrology data to the Test Admin profile for Guna Milana demo.
 * @author        SubhaLagna Team
 * @version      3.3.2
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Profile = require('./models/Profile');
const User = require('./models/User');

const patch = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'admin@test.com' });
    if (!user) {
      console.error('User admin@test.com not found');
      process.exit(1);
    }

    const profile = await Profile.findOne({ user: user._id });
    if (!profile) {
      console.error('Profile for Test Admin not found');
      process.exit(1);
    }

    // Set sample astrology data
    profile.horoscope.nakshatra = 'Rohini';
    profile.horoscope.rashi = 'Taurus';
    profile.horoscope.pada = 1;
    profile.horoscope.gotra = 'Kashyap';

    await profile.save();
    console.log('Successfully patched Test Admin with astrology data.');
    console.log('Current Horoscope:', profile.horoscope);

    process.exit(0);
  } catch (err) {
    console.error('Patch failed:', err);
    process.exit(1);
  }
};

patch();
