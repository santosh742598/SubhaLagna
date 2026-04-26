"use strict";

/**
 * @file SubhaLagna v3.3.7 — MongoDB Connection Configuration
 * @description   Connects to MongoDB via Mongoose with retry logic and
 *                connection event logging.
 * @author        SubhaLagna Team
 * @version      3.3.7
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * Exits the process on critical connection failure (fail-fast strategy).
 * @async
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are defaults in Mongoose 7+, listed here for clarity
      // serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Log when the connection is lost so we know immediately
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected.');
    });
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit immediately — the application cannot run without a database
    process.exit(1);
  }
};

module.exports = connectDB;
