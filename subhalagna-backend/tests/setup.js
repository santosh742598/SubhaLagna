"use strict";

/**
 * @file        SubhaLagna v3.3.9 — Test Setup & Utilities
 * @description   Initializes in-memory MongoDB for integration testing.
 * @version      3.3.9
 * @author        SubhaLagna Team
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

let mongoServer;

/**
 * Connects to the in-memory database.
 */
const connectDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
};

/**
 * Drops the database, closes the connection, and stops the mongod instance.
 */
const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

/**
 * Clears all data from all collections.
 */
const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Generates a mock JWT token for a given user ID.
 * @param {string} userId - The user ID to sign.
 * @returns {string} The mock JWT token.
 */
const generateMockToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '15m' });
};

module.exports = {
  connectDB,
  closeDB,
  clearDB,
  generateMockToken,
};
