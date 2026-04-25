"use strict";

/**
 * @file        SubhaLagna v3.1.0 — Admin DOB Patch
 * @description   One-time patch to fix Date of Birth formatting for legacy admin profiles.
 * @author        SubhaLagna Team
 * @version      3.1.0
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Profile = require('./models/Profile');
const User = require('./models/User');

dotenv.config();

const patch = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@test.com';
    const user = await User.findOne({ email: adminEmail });

    if (!user) {
      console.error('User not found:', adminEmail);
      process.exit(1);
    }

    console.log('Found User:', user.name, '(', user._id, ')');

    const profile = await Profile.findOne({ user: user._id });

    if (!profile) {
      console.error('Profile not found for user:', user._id);
      process.exit(1);
    }

    console.log('Current Profile Data:', {
      age: profile.age,
      dob: profile.horoscope?.dateOfBirth,
      completeness: profile.completenessScore,
    });

    // Update DOB
    profile.horoscope = {
      ...profile.horoscope,
      dateOfBirth: new Date('1995-01-01'),
    };

    // Trigger pre-save hooks (age and completeness calculation)
    await profile.save();

    console.log('Profile Patched Successfully!');
    console.log('New Profile Data:', {
      age: profile.age,
      dob: profile.horoscope.dateOfBirth,
      completeness: profile.completenessScore,
    });

    process.exit(0);
  } catch (err) {
    console.error('Error during patch:', err);
    process.exit(1);
  }
};

patch();
