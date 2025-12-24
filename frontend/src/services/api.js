import axios from 'axios';

// Helper function to ensure base URL ends with /api
const getBaseURL = () => {
  const envUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  // Remove trailing slash if present
  const cleanUrl = envUrl.replace(/\/$/, '');
  // If it doesn't end with /api, add it
  if (!cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/api`;
  }
  return cleanUrl;
};

// Create axios instance
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// Rides API
export const ridesAPI = {
  getRides: (params) => api.get('/rides', { params }),
  getRideById: (id) => api.get(`/rides/${id}`),
  createRide: (rideData) => api.post('/rides', rideData),
  updateRide: (id, rideData) => api.put(`/rides/${id}`, rideData),
  deleteRide: (id) => api.delete(`/rides/${id}`),
  getMyRides: (params) => api.get('/rides/my-rides', { params }),
  getMyRideHistory: (params) => api.get('/rides/my-rides/history', { params }),
};

// Bookings API
export const bookingsAPI = {
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  getMyBookings: (params) => api.get('/bookings', { params }),
  getRideBookings: (rideId, params) => api.get(`/bookings/ride/${rideId}`, { params }),
  updateBookingStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  cancelBooking: (id, reason) => api.put(`/bookings/${id}/cancel`, { cancellationReason: reason }),
};

// Payments API
export const paymentsAPI = {
  createOrder: (rideId, seatsBooked) => api.post('/payments/create-order', { rideId, seatsBooked }),
  verifyPayment: (paymentData) => api.post('/payments/verify', paymentData),
  processRefund: (bookingId, reason) => api.post('/payments/refund', { bookingId, reason }),
  getPaymentHistory: (params) => api.get('/payments/history', { params }),
};

// Reviews API
export const reviewsAPI = {
  createReview: (reviewData) => api.post('/reviews', reviewData),
  getUserReviews: (userId, params) => api.get(`/reviews/user/${userId}`, { params }),
  getRideReviews: (rideId, params) => api.get(`/reviews/ride/${rideId}`, { params }),
  getGivenReviews: (params) => api.get('/reviews/given', { params }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getNotificationCount: () => api.get('/notifications/count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// Chat API
export const chatAPI = {
  sendMessage: (messageData) => api.post('/chat/send', messageData),
  getMessages: (bookingId) => api.get(`/chat/booking/${bookingId}`),
  getConversations: () => api.get('/chat/conversations'),
  getMyConversations: () => api.get('/chat/my-conversations'),
};

export default api;
