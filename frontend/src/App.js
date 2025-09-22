import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StaffDashboard from './pages/staff/StaffDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import CreateRidePage from './pages/staff/CreateRidePage';
import MyRidesPage from './pages/staff/MyRidesPage';
import RideDetailsPage from './pages/RideDetailsPage';
import SearchRidesPage from './pages/student/SearchRidesPage';
import MyBookingsPage from './pages/student/MyBookingsPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import ReviewsPage from './pages/ReviewsPage';
import ProfilePage from './pages/ProfilePage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// MUI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is not loaded yet, show loading
  if (!user) {
    return <LoadingSpinner />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Main App Layout
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!isAuthenticated) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main 
          className="flex-1 p-6 transition-all duration-300"
          style={{
            marginLeft: sidebarOpen ? '280px' : '0px',
            width: sidebarOpen ? 'calc(100% - 280px)' : '100%'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

// App Routes
const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/login" 
        element={isAuthenticated && user ? <Navigate to={user.role === 'staff' ? '/staff/dashboard' : '/student/dashboard'} replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated && user ? <Navigate to={user.role === 'staff' ? '/staff/dashboard' : '/student/dashboard'} replace /> : <RegisterPage />} 
      />

      {/* Staff Routes */}
      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <AppLayout>
              <StaffDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/rides/create"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <AppLayout>
              <CreateRidePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/rides"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <AppLayout>
              <MyRidesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/rides/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <AppLayout>
              <CreateRidePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout>
              <StudentDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/search"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout>
              <SearchRidesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/bookings"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout>
              <MyBookingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Shared Routes */}
      <Route
        path="/rides/:id"
        element={
          <AppLayout>
            <RideDetailsPage />
          </AppLayout>
        }
      />
      <Route
        path="/payments/history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PaymentHistoryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReviewsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
