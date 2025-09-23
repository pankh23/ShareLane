const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Student only)
const createBooking = async (req, res) => {
  try {
    const { rideId, seatsBooked, specialRequests, contactPhone, pickupNotes } = req.body;
    const studentId = req.user._id;

    // Find the ride
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if ride is active
    if (ride.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Ride is not available for booking'
      });
    }

    // Check if student is trying to book their own ride
    if (ride.providerId.toString() === studentId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book your own ride'
      });
    }

    // Check if enough seats are available
    if (ride.availableSeats < seatsBooked) {
      return res.status(400).json({
        success: false,
        message: 'Not enough seats available'
      });
    }

    // Check if student already has a booking for this ride
    const existingBooking = await Booking.findOne({
      rideId,
      studentId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a booking for this ride'
      });
    }

    // Calculate total price
    const totalPrice = ride.pricePerSeat * seatsBooked;

    // Create booking
    const booking = new Booking({
      rideId,
      studentId,
      seatsBooked,
      totalPrice,
      specialRequests,
      contactPhone,
      pickupNotes
    });

    await booking.save();

    // Update available seats
    ride.availableSeats -= seatsBooked;
    await ride.save();

    // Create notification for staff
    await Notification.create({
      userId: ride.providerId,
      title: 'New Booking Received',
      message: `You have a new booking for ${seatsBooked} seat(s) on your ride to ${ride.destination}`,
      type: 'booking',
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'high'
    });

    // Populate booking details
    await booking.populate([
      { path: 'rideId', select: 'pickupLocation destination date time pricePerSeat' },
      { path: 'studentId', select: 'name email phone' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating booking'
    });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user._id;

    const filter = { studentId: userId };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate({
        path: 'rideId',
        select: 'pickupLocation destination date time pricePerSeat status',
        populate: {
          path: 'providerId',
          select: 'name email phone averageRating'
        }
      })
      .populate('studentId', 'name email phone')
      .sort({ bookedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out bookings where rideId is null (ride was deleted)
    const validBookings = bookings.filter(booking => booking.rideId !== null);

    // Count only valid bookings (with valid rideId)
    const total = await Booking.countDocuments({ ...filter, rideId: { $ne: null } });

    res.json({
      success: true,
      data: {
        bookings: validBookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBookings: total,
          hasNext: skip + validBookings.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings'
    });
  }
};

// @desc    Get bookings for a specific ride (Staff only)
// @route   GET /api/bookings/ride/:rideId
// @access  Private (Staff only)
const getRideBookings = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Verify the ride belongs to the current user
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bookings for this ride'
      });
    }

    const filter = { rideId };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('studentId', 'name email phone')
      .populate('rideId', 'pickupLocation destination date time')
      .sort({ bookedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBookings: total,
          hasNext: skip + bookings.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get ride bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ride bookings'
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    const ride = await Ride.findById(booking.rideId);
    const isStaff = req.user.role === 'staff' && ride.providerId.toString() === req.user._id.toString();
    const isStudent = req.user.role === 'student' && booking.studentId.toString() === req.user._id.toString();

    if (!isStaff && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Update booking status
    booking.status = status;
    if (status === 'confirmed') {
      booking.confirmedAt = new Date();
    } else if (status === 'completed') {
      booking.completedAt = new Date();
    } else if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancellationReason = req.body.cancellationReason || 'No reason provided';
    }

    await booking.save();

    // Create notification
    const notificationUserId = isStaff ? booking.studentId : ride.providerId;
    await Notification.create({
      userId: notificationUserId,
      title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your booking has been ${status}`,
      type: 'booking',
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'medium'
    });

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: { booking }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking status'
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Student only - own bookings)
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking
    if (booking.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = cancellationReason || 'No reason provided';

    // Refund available seats
    const ride = await Ride.findById(booking.rideId);
    ride.availableSeats = Math.min(ride.availableSeats + booking.seatsBooked, ride.totalSeats);
    await ride.save();

    await booking.save();

    // Create notification for staff
    await Notification.create({
      userId: ride.providerId,
      title: 'Booking Cancelled',
      message: `A booking for ${booking.seatsBooked} seat(s) has been cancelled`,
      type: 'cancellation',
      relatedId: booking._id,
      relatedType: 'booking',
      priority: 'medium'
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking'
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getRideBookings,
  updateBookingStatus,
  cancelBooking
};
