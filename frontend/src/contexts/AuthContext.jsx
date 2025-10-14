import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

// Create authentication context
const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Configure axios defaults
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE}/auth/me`);
        setUser(response.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError('');
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      });

      const { user: userData, token } = response.data;

      // Store token and set auth header
      localStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  // Register function (admin only)
  const register = async (userData) => {
    try {
      setError('');
      const response = await axios.post(`${API_BASE}/auth/register`, userData);
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError('');
      await axios.post(`${API_BASE}/auth/change-password`, {
        currentPassword,
        newPassword
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Password change failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Get all users (admin only)
  const getUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth/users`);
      return { success: true, users: response.data.users };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch users';
      return { success: false, error: errorMessage };
    }
  };

  // Update user (admin only)
  const updateUser = async (userId, userData) => {
    try {
      const response = await axios.put(`${API_BASE}/auth/users/${userId}`, userData);
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update user';
      return { success: false, error: errorMessage };
    }
  };

  // Role checking helpers
  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  const isAdmin = () => hasRole('admin');
  const isCoordinator = () => hasRole('coordinator');
  const isVolunteer = () => hasRole('volunteer');
  const canManageUsers = () => isAdmin();
  const canManageRequests = () => hasAnyRole(['admin', 'coordinator']);
  const canDeliverRequests = () => hasAnyRole(['admin', 'coordinator', 'volunteer']);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    changePassword,
    getUsers,
    updateUser,
    hasRole,
    hasAnyRole,
    isAdmin,
    isCoordinator,
    isVolunteer,
    canManageUsers,
    canManageRequests,
    canDeliverRequests
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;