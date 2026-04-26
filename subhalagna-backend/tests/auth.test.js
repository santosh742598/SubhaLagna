'use strict';

/**
 * @file        SubhaLagna v3.3.3 — Auth Integration Tests
 * @description   Basic smoke tests for Authentication workflows.
 * @version      3.3.3
 * @author        SubhaLagna Team
 */

const request = require('supertest');
const express = require('express');
const { connectDB, closeDB, clearDB } = require('./setup');
const authRoutes = require('../routes/authRoutes');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock process.env
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});

describe('Authentication Flow', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      phone: '1234567890',
    });

    // Because we mock OTP in our test environment?
    // Actually, register just creates the user and asks for OTP verification.
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.message).toContain('OTP sent');

    // Verify user exists in DB
    const user = await User.findOne({ email: 'test@example.com' });
    expect(user).toBeTruthy();
    expect(user.isVerified).toBe(false);
  });
});
