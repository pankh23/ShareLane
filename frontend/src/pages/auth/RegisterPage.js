import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  LinearProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  DirectionsCar as CarIcon,
  VerifiedUser as VerifiedIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, verifyOtp, resendOtp, isAuthenticated, user, error, clearError } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [registrationData, setRegistrationData] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    getValues
  } = useForm({
    defaultValues: {
      role: 'student',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    }
  });

  const roleValue = watch('role');
  const password = watch('password');
  const email = watch('email');
  const name = watch('name');
  const phone = watch('phone');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'staff' ? '/staff/dashboard' : '/student/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data, e) => {
    e?.preventDefault(); // Prevent form reset
    
    // If OTP is already sent, verify the OTP instead
    if (otpSent && otpValue.length === 6) {
      setVerifyingOtp(true);
      const result = await verifyOtp(userEmail, otpValue);
      setVerifyingOtp(false);
      
      if (result.success && result.user) {
        // Redirect will happen automatically via useEffect when user is authenticated
        const redirectPath = result.user.role === 'staff' ? '/staff/dashboard' : '/student/dashboard';
        navigate(redirectPath, { replace: true });
      } else {
        // Error toast is already shown in verifyOtp function
        setOtpValue(''); // Clear OTP input on error
      }
      return;
    }

    // First time submission - send OTP
    if (!otpSent) {
      // Store email immediately
      setUserEmail(data.email);
      
      // Send OTP - no loading state, no form reset
      const result = await registerUser(data);
      
      if (result.success && result.email) {
        // Set OTP sent state - this will disable registration fields and enable OTP field
        setOtpSent(true);
        // Form values are automatically preserved by react-hook-form - no reset needed
      }
      // If it fails, form data is still there, user can retry
    }
  };

  const handleResendOtp = async () => {
    if (!userEmail) {
      toast.error('Please register first');
      return;
    }
    
    setResendingOtp(true);
    const result = await resendOtp(userEmail);
    setResendingOtp(false);
    
    if (result.success) {
      setOtpValue(''); // Clear current OTP input
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtpValue(value);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleBackToEdit = () => {
    setOtpSent(false);
    setOtpValue('');
    clearError();
    // Restore form values
    if (registrationData) {
      setValue('name', registrationData.name);
      setValue('email', registrationData.email);
      setValue('phone', registrationData.phone);
      setValue('role', registrationData.role);
      setValue('password', registrationData.password);
      setValue('confirmPassword', registrationData.confirmPassword);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CarIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
          <Typography variant="h3" component="h1" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
            ShareLane
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Join the Campus Ride Sharing Community
          </Typography>
        </Box>

        <Card elevation={24} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Create Account
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {otpSent ? 'Enter OTP to verify your email' : 'Fill in your details and verify your email'}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {otpSent && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    OTP sent to <strong>{userEmail}</strong>
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={handleResendOtp}
                    disabled={resendingOtp}
                    startIcon={<RefreshIcon />}
                    sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                  >
                    {resendingOtp ? 'Resending...' : 'Resend OTP'}
                  </Button>
                </Box>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                fullWidth
                label="First Name"
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={otpSent}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={otpSent}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Phone Number"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[+]?[\d\s\-()]+$/,
                    message: 'Invalid phone number'
                  }
                })}
                error={!!errors.phone}
                helperText={errors.phone?.message}
                disabled={otpSent}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <FormControl
                fullWidth
                error={!!errors.role}
                sx={{ mb: 3 }}
                disabled={otpSent}
              >
                <InputLabel>Role</InputLabel>
                <Select
                  {...register('role', { required: 'Please select a role' })}
                  label="Role"
                  value={roleValue || 'student'}
                >
                  <MenuItem value="student">
                    <Box>
                      <Typography variant="body1">Student</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Book rides and share costs
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="staff">
                    <Box>
                      <Typography variant="body1">Staff</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Create rides and earn money (Authorized users only)
                      </Typography>
                    </Box>
                  </MenuItem>
                </Select>
                {errors.role && (
                  <FormHelperText>{errors.role.message}</FormHelperText>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={otpSent}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        disabled={otpSent}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                disabled={otpSent}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {/* OTP Input Field - Always Visible */}
              <Box sx={{ mb: 3, p: 2, bgcolor: otpSent ? 'action.selected' : 'grey.50', borderRadius: 2, border: otpSent ? '2px solid' : '1px solid', borderColor: otpSent ? 'primary.main' : 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <VerifiedIcon color={otpSent ? 'primary' : 'disabled'} sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color={otpSent ? 'primary' : 'text.secondary'}>
                    Email Verification Code
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  label="Enter 6-digit OTP"
                  value={otpValue}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  disabled={!otpSent}
                  helperText={otpSent ? "Enter the code sent to your email" : "Complete registration above to receive OTP"}
                  inputProps={{
                    maxLength: 6,
                    style: {
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      letterSpacing: '0.5rem',
                      fontWeight: 'bold'
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1.5rem'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VerifiedIcon color={otpSent ? 'primary' : 'disabled'} />
                      </InputAdornment>
                    ),
                  }}
                />
                {otpSent && (
                  <Box sx={{ mt: 1, textAlign: 'center' }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleResendOtp}
                      disabled={resendingOtp}
                      startIcon={<RefreshIcon />}
                      sx={{ textTransform: 'none' }}
                    >
                      {resendingOtp ? 'Resending...' : 'Resend OTP'}
                    </Button>
                  </Box>
                )}
              </Box>

              {otpSent && (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleBackToEdit}
                  sx={{
                    py: 1,
                    mb: 2,
                    textTransform: 'none'
                  }}
                >
                  Edit Registration Details
                </Button>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={verifyingOtp || (otpSent && otpValue.length !== 6)}
                sx={{
                  py: 1.5,
                  mb: 3,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2
                }}
              >
                {verifyingOtp ? 'Verifying...' : otpSent ? 'Verify & Complete Registration' : 'Send OTP & Register'}
              </Button>

              {verifyingOtp && (
                <LinearProgress sx={{ mb: 2 }} />
              )}
            </form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterPage;
