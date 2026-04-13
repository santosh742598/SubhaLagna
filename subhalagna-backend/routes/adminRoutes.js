/**
 * @file SubhaLagna v3.0.1 — Admin Routes
 * @description Route definitions for the admin dashboard.
 * - v2.4.0 changes:
 *   - Added GET /api/admin/payments/ledger for full transaction oversight. [v2.4.0]
 * - v2.3.0 changes:
 *   - Added GET /api/admin/plans and PUT /api/admin/plans/:id for dynamic membership control.
 *   - Integrated plan management into the administrative API surface.
 * @version      3.0.1
 */

'use strict';

const express = require('express');
const router = express.Router();

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
  verifyBankPayment,
  getAllPayments,
  getAllPlans,
  updatePlan,
  createPlan,
  createUserWithProfile,
  updateUserAndProfile,
  uploadUserPhotosAdmin,
} = require('../controllers/adminController');

const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadProfilePhotos } = require('../middleware/uploadMiddleware');

// Apply both guards to every admin route
router.use(protect, adminOnly);

// USER MANAGEMENT (Super Edit)
router.put('/users/:id', updateUserAndProfile);
router.post('/users', createUserWithProfile);
router.post('/profiles/:id/photos', uploadProfilePhotos, uploadUserPhotosAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/suspend', toggleSuspendUser);
router.put('/profiles/:id/verify', toggleVerifyProfile);
router.delete('/users/:id', deleteUser);

// Coupons
router.get('/coupons', getAllCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Manual Subscription
router.post('/users/:id/upgrade', manualUpgradeUser);

// Bank Payment Verification
router.get('/payments/pending', getPendingPayments);
router.get('/payments/ledger', getAllPayments);
router.put('/payments/:id/verify', verifyBankPayment);

// Membership Plans
router.get('/plans', getAllPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);

module.exports = router;
