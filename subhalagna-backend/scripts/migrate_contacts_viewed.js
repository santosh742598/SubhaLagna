"use strict";

/* eslint-disable no-console */

/**
 * @file        SubhaLagna v3.3.9 — ContactsViewed Migration Script
 * @description   One-time migration: reads all users with `contactsViewed` entries
 *                and creates corresponding `ContactView` documents in the new collection.
 *                Safe to run multiple times (uses upsert to prevent duplicates).
 *
 *                Usage: node scripts/migrate_contacts_viewed.js
 *
 *                Requires MONGO_URI in .env or as environment variable.
 *                - v3.3.4 changes:
 *                  - Standardized ESLint no-console overrides.
 *                - v3.3.2 changes:
 *                  - Initial creation as part of scalability refactor (P2-13).
 * @author        SubhaLagna Team
 * @version      3.3.9
 */

const mongoose = require('mongoose');
const path = require('path');

// Load .env from backend root
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const ContactView = require('../models/ContactView');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in environment. Aborting.');
  process.exit(1);
}

/**
 * Migrates contactsViewed arrays from User documents to ContactView collection.
 * @returns {Promise<void>}
 */
const migrate = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.\n');

    // Find all users who have at least one contact viewed
    const users = await User.find(
      { 'contactsViewed.0': { $exists: true } },
      { _id: 1, contactsViewed: 1 },
    ).lean();

    console.log(`📋 Found ${users.length} users with contactsViewed entries.\n`);

    let totalMigrated = 0;
    let totalSkipped = 0;

    for (const user of users) {
      for (const profileId of user.contactsViewed) {
        try {
          await ContactView.updateOne(
            { user: user._id, viewedProfile: profileId },
            { user: user._id, viewedProfile: profileId },
            { upsert: true },
          );
          totalMigrated++;
        } catch (err) {
          // Duplicate key errors are expected if re-run — skip gracefully
          if (err.code === 11000) {
            totalSkipped++;
          } else {
            console.error(
              `  ⚠️ Error migrating user ${user._id} → profile ${profileId}:`,
              err.message,
            );
          }
        }
      }
      console.log(`  ✅ User ${user._id}: ${user.contactsViewed.length} entries processed`);
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   Migrated: ${totalMigrated}`);
    console.log(`   Skipped (duplicates): ${totalSkipped}`);
    console.log(`\n💡 You can now safely clear the contactsViewed arrays from User documents.`);
    console.log(`   Run in Mongo shell: db.users.updateMany({}, { $set: { contactsViewed: [] } })`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
  }
};

migrate();
