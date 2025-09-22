const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  getPaymentHistory,
  handleWebhook
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

// @route   POST /api/payments/create-intent
// @desc    Create Stripe payment intent
// @access  Private (Student only)
router.post('/create-intent', authenticate, authorize('student'), createPaymentIntent);

// @route   POST /api/payments/confirm
// @desc    Confirm payment
// @access  Private
router.post('/confirm', authenticate, confirmPayment);

// @route   POST /api/payments/refund
// @desc    Process refund
// @access  Private (Staff only)
router.post('/refund', authenticate, authorize('staff'), processRefund);

// @route   GET /api/payments/history
// @desc    Get payment history
// @access  Private
router.get('/history', authenticate, getPaymentHistory);

// @route   POST /api/payments/webhook
// @desc    Stripe webhook handler
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
