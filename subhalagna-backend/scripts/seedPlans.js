"use strict";

/* eslint-disable no-console */

/**
 * @file SubhaLagna v3.4.0 — Membership Plan Seeder
 * @description   Initializes the database with standard Gold and Platinum plans.
 *                - v3.3.4 changes:
 *                  - Fixed relative paths for remote server execution.
 *                  - Standardized ESLint no-console overrides.
 * @author        SubhaLagna Team
 * @version      3.4.0
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MembershipPlan = require('../models/MembershipPlan');
const hardcodedPlans = require('../config/plans');

dotenv.config();

const seedPlans = async () => {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/subhalagna');
    console.log('Connected!');

    console.log('Cleaning existing plans...');
    await MembershipPlan.deleteMany({});

    console.log('Seeding plans from config...');
    const plansToInsert = hardcodedPlans.map((p) => ({
      planId: p.id,
      name: p.name,
      price: p.price,
      durationInMonths: p.durationInMonths,
      description: p.description,
      features: p.features,
      contactsAllowed: p.contactsAllowed || 0,
      popular: p.popular || false,
      isActive: true,
    }));

    await MembershipPlan.insertMany(plansToInsert);
    console.log('Seeding Complete! 🎉');

    process.exit(0);
  } catch (err) {
    console.error('Seeding Failed:', err);
    process.exit(1);
  }
};

seedPlans();
