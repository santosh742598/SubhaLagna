"use strict";

/**
 * @file Migration Script: Transition Manglik status from Boolean to String Enum
 * @description   Converts existing true/false values to 'Yes'/'No'.
 *                Updates missing or null values to 'Unknown'.
 * @version      3.2.5
 * @author        SubhaLagna Team
 */

const mongoose = require('mongoose');
const Profile = require('./models/Profile');
require('dotenv').config();

const migrateManglik = async () => {
  try {
    console.log('🚀 Starting Manglik migration...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to Database');

    // 1. Convert true to 'Yes'
    const yesResult = await Profile.updateMany(
      { 'horoscope.manglik': true },
      { $set: { 'horoscope.manglik': 'Yes' } },
    );
    console.log(`🔹 Converted ${yesResult.modifiedCount} "true" values to "Yes"`);

    // 2. Convert false to 'No'
    const noResult = await Profile.updateMany(
      { 'horoscope.manglik': false },
      { $set: { 'horoscope.manglik': 'No' } },
    );
    console.log(`🔹 Converted ${noResult.modifiedCount} "false" values to "No"`);

    // 3. Handle any that are neither (null or undefined)
    const unknownResult = await Profile.updateMany(
      { 'horoscope.manglik': { $nin: ['Yes', 'No'] } },
      { $set: { 'horoscope.manglik': 'Unknown' } },
    );
    console.log(`🔹 Initialized ${unknownResult.modifiedCount} null/missing values to "Unknown"`);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

migrateManglik();
