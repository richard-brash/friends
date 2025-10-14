import React from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from './auth/LoginPage';

// Component to protect routes that require authentication
export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Check role-based permissions if roles are specified
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to access this area. 
          Required role: {requiredRoles.join(' or ')}. 
          Your role: {user.role}
        </Alert>
      </Box>
    );
  }

  // Render protected content
  return children;
};

// Component specifically for admin-only routes
export const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
};

// Component for coordinator and admin routes
export const CoordinatorRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRoles={['admin', 'coordinator']}>
      {children}
    </ProtectedRoute>
  );
};

// Component for all authenticated users
export const AuthenticatedRoute = ({ children }) => {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;