import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  Person,
  Email,
  AdminPanelSettings,
  SupervisorAccount,
  VolunteerActivism,
  Lock,
  Edit,
  Save,
  Cancel,
  Logout
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export default function UserProfile() {
  const { user, logout, changePassword } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings color="error" />;
      case 'coordinator': return <SupervisorAccount color="primary" />;
      case 'volunteer': return <VolunteerActivism color="success" />;
      default: return <Person />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'coordinator': return 'primary';
      case 'volunteer': return 'success';
      default: return 'default';
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin':
        return 'Full system access: manage users, configure system settings, and oversee all operations';
      case 'coordinator':
        return 'Manage requests, assign deliveries, and coordinate volunteer activities';
      case 'volunteer':
        return 'Record delivery attempts and update request status during runs';
      default:
        return 'Basic user access';
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);

    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      if (result.success) {
        setShowPasswordDialog(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // You could show a success message here
      } else {
        setPasswordError(result.error);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}
            >
              {user.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {user.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Email fontSize="small" color="action" />
                <Typography variant="body1" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              <Chip
                icon={getRoleIcon(user.role)}
                label={user.role?.toUpperCase()}
                color={getRoleColor(user.role)}
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Role & Permissions
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {getRoleIcon(user.role)}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getRoleDescription(user.role)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Settings
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Lock />
              </ListItemIcon>
              <ListItemText
                primary="Password"
                secondary="Change your account password"
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowPasswordDialog(true)}
              >
                Change Password
              </Button>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({
              ...passwordForm,
              currentPassword: e.target.value
            })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({
              ...passwordForm,
              newPassword: e.target.value
            })}
            sx={{ mb: 2 }}
            helperText="Must be at least 6 characters long"
          />
          
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({
              ...passwordForm,
              confirmPassword: e.target.value
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowPasswordDialog(false);
              setPasswordError('');
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            disabled={passwordLoading}
          >
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}