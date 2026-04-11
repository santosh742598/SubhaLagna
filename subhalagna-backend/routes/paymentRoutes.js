/**
 * @fileoverview SubhaLagna v2.0.6 — Payment Routes
 * @description   Endpoints for subscription management and payments.
 * @version       2.0.2
 */

const express = require('express');
const router  = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Public Plans List
router.get('/plans', paymentController.getPlans);

// Protected Payment Endpoints
router.use(protect); // Ensure user is logged in

router.post('/validate-coupon', paymentController.validateCoupon);
router.post('/order',           paymentController.createOrder);
router.post('/verify',          paymentController.verifyPayment);
router.post('/confirm-free',    paymentController.confirmFreeSubscription);
router.post('/bank-transfer',   paymentController.requestBankTransfer);

module.exports = router;
