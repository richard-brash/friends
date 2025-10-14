import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // Login successful, AuthContext will handle navigation
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    const demoUsers = {
      admin: { email: 'admin@friendsoutreach.org', password: 'password' },
      coordinator: { email: 'john@friendsoutreach.org', password: 'password' },
      volunteer: { email: 'sarah@friendsoutreach.org', password: 'password' }
    };

    const user = demoUsers[role];
    if (user) {
      setFormData(user);
      setIsLoading(true);
      try {
        await login(user.email, user.password);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 1
              }}
            >
              Friends Outreach
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <LoginIcon />
                )
              }
              sx={{ mb: 2 }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          {/* Demo Accounts */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: 'grey.50'
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                textAlign: 'center',
                color: 'text.secondary'
              }}
            >
              Demo Accounts
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => handleDemoLogin('admin')}
                disabled={isLoading}
                sx={{ justifyContent: 'flex-start' }}
              >
                <strong>Admin:</strong>&nbsp;admin@friendsoutreach.org
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => handleDemoLogin('coordinator')}
                disabled={isLoading}
                sx={{ justifyContent: 'flex-start' }}
              >
                <strong>Coordinator:</strong>&nbsp;john@friendsoutreach.org
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={() => handleDemoLogin('volunteer')}
                disabled={isLoading}
                sx={{ justifyContent: 'flex-start' }}
              >
                <strong>Volunteer:</strong>&nbsp;sarah@friendsoutreach.org
              </Button>
            </Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                mt: 2,
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              All demo accounts use password: <strong>password</strong>
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
}