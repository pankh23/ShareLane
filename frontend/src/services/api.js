import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
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
  createPaymentIntent: (bookingId) => api.post('/payments/create-intent', { bookingId }),
  confirmPayment: (paymentIntentId) => api.post('/payments/confirm', { paymentIntentId }),
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

export default api;
