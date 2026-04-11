/**
 * @fileoverview SubhaLagna v2.3.0 — Data Maintenance Script
 * @description   Repair script to synchronize the 'age' field based on 'horoscope.dateOfBirth'.
 *                Run this to ensure search results are accurate after switching from
 *                manual age entry to date-of-birth derived age.
 * 
 * Usage: node scratch/sync-age.js
 */

const mongoose = require('mongoose');
const path     = require('path');
const dotenv   = require('dotenv');

// ── Load Environment Variables ──────────────────────────────────────────────
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Profile = require('../models/Profile');

async function repairAgeData() {
  console.log('🚀 Starting Age & DOB Synchronization...');
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const profiles = await Profile.find({});
    console.log(`📊 Found ${profiles.length} profiles to process.\n`);

    let updatedCount = 0;
    let missingDobCount = 0;

    for (const profile of profiles) {
      if (profile.horoscope?.dateOfBirth) {
        const dob = new Date(profile.horoscope.dateOfBirth);
        const age = Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970);
        
        // Only update if current age is different/missing
        if (profile.age !== age) {
          profile.age = age;
          await profile.save();
          console.log(`   [UPDATED] Profile: ${profile.name.padEnd(20)} | New Age: ${age}`);
          updatedCount++;
        }
      } else {
        console.warn(`   [WARNING] Profile: ${profile.name.padEnd(20)} | Missing DOB! (Search results may be hidden)`);
        missingDobCount++;
      }
    }

    console.log('\n--- Status Report ---');
    console.log(`✅ Profiles Synced:   ${updatedCount}`);
    console.log(`⚠️ Profiles Missing DOB: ${missingDobCount}`);
    console.log('---------------------\n');

  } catch (err) {
    console.error('❌ Data Repair Failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

repairAgeData();
