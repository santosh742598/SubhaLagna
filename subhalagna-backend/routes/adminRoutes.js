/**
 * @fileoverview SubhaLagna v2.0.6 — Admin Routes
 * @description   Route definitions for the admin dashboard.
 *                ALL routes require both `protect` and `adminOnly` middleware.
 * @version       2.1.0
 *
 * Base path: /api/admin
 */

'use strict';

const express = require('express');
const router  = express.Router();

const {
  getDashboardStats,
  getAllUsers,
  toggleSuspendUser,
  toggleVerifyProfile,
  deleteUser,
  getAllCoupons,
  createCoupon,
  deleteCoupon,
  manualUpgradeUser,
  getPendingPayments,
  verifyBankPayment
} = require('../controllers/adminController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// Apply both guards to every admin route
router.use(protect, adminOnly);

router.get('/stats',                    getDashboardStats);
router.get('/users',                    getAllUsers);
router.put('/users/:id/suspend',        toggleSuspendUser);
router.put('/profiles/:id/verify',      toggleVerifyProfile);
router.delete('/users/:id',             deleteUser);

// Coupons
router.get('/coupons',                  getAllCoupons);
router.post('/coupons',                 createCoupon);
router.delete('/coupons/:id',           deleteCoupon);

// Manual Subscription
router.post('/users/:id/upgrade',       manualUpgradeUser);

// Bank Payment Verification
router.get('/payments/pending',         getPendingPayments);
router.put('/payments/:id/verify',      verifyBankPayment);

module.exports = router;
