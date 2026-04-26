"use strict";

/**
 * @file        SubhaLagna v3.3.5 — Profile Integration Tests
 * @description   Basic smoke tests for Profile workflow.
 * @version      3.3.5
 * @author        SubhaLagna Team
 */

const request = require('supertest');
const express = require('express');
const { connectDB, closeDB, clearDB, generateMockToken } = require('./setup');
const profileRoutes = require('../routes/profileRoutes');
const User = require('../models/User');
const Profile = require('../models/Profile');

const app = express();
app.use(express.json());
app.use('/api/profiles', profileRoutes);

// Mock process.env
process.env.JWT_SECRET = 'test_secret';

let mockUser;
let mockToken;

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  // Create a mock user
  mockUser = await User.create({
    name: 'Test Profile',
    email: 'profile@example.com',
    password: 'Password123',
    phone: '0987654321',
    isVerified: true,
  });
  mockToken = generateMockToken(mockUser._id);
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});

describe('Profile Flow', () => {
  it('should create a new profile for a verified user', async () => {
    const res = await request(app)
      .post('/api/profiles/setup')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        gender: 'Female',
        dateOfBirth: '1995-05-15',
        height: '5\' 6"',
        motherTongue: 'Odia',
        religion: 'Hindu',
        caste: 'Khandayat',
        maritalStatus: 'Never Married',
        currentCity: 'Bhubaneswar',
        currentState: 'Odisha',
        education: 'B.Tech',
        profession: 'Software Engineer',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();

    const profile = await Profile.findOne({ user: mockUser._id });
    expect(profile).toBeTruthy();
    expect(profile.gender).toBe('Female');

    // Test that age is automatically calculated by pre-save hook
    expect(profile.age).toBeGreaterThan(20);
  });
});
