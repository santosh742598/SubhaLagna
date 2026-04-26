"use strict";

/* eslint-disable no-console */

/**
 * @file        SubhaLagna v3.3.5 — Database Connectivity Diagnostic
 * @description   CLI tool to verify MongoDB connection and collection counts.
 *                - v3.3.4 changes:
 *                  - Initial creation for server-side troubleshooting.
 * @author        SubhaLagna Team
 * @version      3.3.5
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const check = async () => {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected!');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const MembershipPlan = mongoose.model('MembershipPlan', new mongoose.Schema({}, { strict: false }));
    const count = await MembershipPlan.countDocuments();
    console.log('MembershipPlan count:', count);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
};
check();
