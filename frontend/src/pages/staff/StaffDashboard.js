import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Paper,
  Divider
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, bookingsAPI, notificationsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    activeRides: 0,
    totalBookings: 0,
    totalEarnings: 0
  });
  const [recentRides, setRecentRides] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [hasEverCreatedRides, setHasEverCreatedRides] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent rides
      const ridesResponse = await ridesAPI.getMyRides({ limit: 5 });
      const rides = ridesResponse.data.data.rides;
      setRecentRides(rides);

      // Check if staff member has ever created rides (including historical ones)
      const historyResponse = await ridesAPI.getMyRideHistory({ limit: 1 });
      const hasEverCreatedRides = historyResponse.data.data.pagination.totalRides > 0;
      console.log('Ride history check:', {
        totalRides: historyResponse.data.data.pagination.totalRides,
        hasEverCreatedRides,
        rides: historyResponse.data.data.rides
      });
      setHasEverCreatedRides(hasEverCreatedRides);

      // Calculate stats
      const totalRides = rides.length;
      const activeRides = rides.filter(ride => ride.status === 'active').length;
      
      // Fetch bookings for all rides
      let totalBookings = 0;
      let totalEarnings = 0;
      const recentBookingsList = [];

      for (const ride of rides) {
        try {
          const bookingsResponse = await bookingsAPI.getRideBookings(ride._id, { limit: 3 });
          const rideBookings = bookingsResponse.data.data.bookings;
          totalBookings += rideBookings.length;
          
          rideBookings.forEach(booking => {
            if (booking.paymentStatus === 'paid') {
              totalEarnings += booking.totalPrice;
            }
            recentBookingsList.push({ ...booking, ride });
          });
        } catch (error) {
          console.error('Error fetching bookings for ride:', error);
        }
      }

      setRecentBookings(recentBookingsList.slice(0, 5));
      setStats({
        totalRides,
        activeRides,
        totalBookings,
        totalEarnings
      });

      // Fetch notifications
      const notificationsResponse = await notificationsAPI.getNotifications({ limit: 5 });
      setNotifications(notificationsResponse.data.data.notifications);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Welcome back, {user?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your rides today
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CarIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Total Rides
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.totalRides}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Active Rides
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.activeRides}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PeopleIcon sx={{ color: 'info.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Total Bookings
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.totalBookings}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MoneyIcon sx={{ color: 'warning.main', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Total Earnings
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(stats.totalEarnings)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/staff/rides/create')}
              >
                Create New Ride
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/staff/rides')}
              >
                View All Rides
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/payments/history')}
              >
                View Earnings
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Recent Rides */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Recent Rides
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/staff/rides')}
                  >
                    View All
                  </Button>
                </Box>
                
                {recentRides.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {hasEverCreatedRides ? 'No recent rides' : 'No rides created yet'}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/staff/rides/create')}
                    >
                      {hasEverCreatedRides ? 'Create New Ride' : 'Create Your First Ride'}
                    </Button>
                  </Box>
                ) : (
                  <List>
                    {recentRides.map((ride, index) => (
                      <React.Fragment key={ride._id}>
                        <ListItem
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/rides/${ride._id}`)}
                        >
                          <ListItemIcon>
                            <CarIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${ride.pickupLocation} → ${ride.destination}`}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(ride.date).toLocaleDateString()} at {ride.time}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Chip
                                    label={ride.status}
                                    size="small"
                                    color={getStatusColor(ride.status)}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {ride.availableSeats}/{ride.totalSeats} seats
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentRides.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Bookings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Recent Bookings
                  </Typography>
                </Box>
                
                {recentBookings.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No bookings yet
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {recentBookings.map((booking, index) => (
                      <React.Fragment key={booking._id}>
                        <ListItem>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {booking.studentId?.name?.charAt(0)}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={booking.studentId?.name || 'Unknown User'}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {booking.ride?.pickupLocation} → {booking.ride?.destination}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Chip
                                    label={booking.status}
                                    size="small"
                                    color={getStatusColor(booking.status)}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {booking.seatsBooked} seat(s) • {formatCurrency(booking.totalPrice)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentBookings.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default StaffDashboard;
