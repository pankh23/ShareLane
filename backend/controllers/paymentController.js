const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private (Student only)
const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('rideId', 'pickupLocation destination date time pricePerSeat')
      .populate('studentId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking
    if (booking.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this booking'
      });
    }

    // Check if booking is in pending status
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in pending status'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        studentId: booking.studentId._id.toString(),
        rideId: booking.rideId._id.toString()
      },
      description: `Ride booking: ${booking.rideId.pickupLocation} to ${booking.rideId.destination}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update booking with payment intent ID
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: booking.totalPrice
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment intent'
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    // Find booking by payment intent ID
    const booking = await Booking.findOne({ paymentIntentId })
      .populate('rideId', 'providerId pickupLocation destination')
      .populate('studentId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking status
    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    booking.confirmedAt = new Date();
    await booking.save();

    // Create notification for staff
    await Notification.create({
      userId: booking.rideId.providerId,
      title: 'Payment Received',
      message: `Payment received for booking to ${booking.rideId.destination}`,
      type: 'payment',
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high'
    });

    // Create notification for student
    await Notification.create({
      userId: booking.studentId._id,
      title: 'Payment Confirmed',
      message: 'Your payment has been confirmed and booking is now active',
      type: 'payment',
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while confirming payment'
    });
  }
};

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private (Staff only)
const processRefund = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('rideId', 'providerId')
      .populate('studentId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the ride provider
    if (booking.rideId.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process refund for this booking'
      });
    }

    // Check if booking has been paid
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking has not been paid'
      });
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentIntentId,
      reason: reason || 'requested_by_customer',
      metadata: {
        bookingId: booking._id.toString(),
        reason: reason || 'No reason provided'
      }
    });

    // Update booking
    booking.paymentStatus = 'refunded';
    booking.refundId = refund.id;
    await booking.save();

    // Create notification for student
    await Notification.create({
      userId: booking.studentId._id,
      title: 'Refund Processed',
      message: 'Your refund has been processed and will appear in your account within 5-10 business days',
      type: 'payment',
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'medium'
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: { refund, booking }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing refund'
    });
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const filter = { studentId: userId, paymentStatus: { $in: ['paid', 'refunded'] } };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('rideId', 'pickupLocation destination date time')
      .sort({ bookedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        payments: bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalPayments: total,
          hasNext: skip + bookings.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment history'
    });
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public (Stripe webhook)
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      // Handle successful payment
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  getPaymentHistory,
  handleWebhook
};
