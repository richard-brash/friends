import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Grid,
  Avatar,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AdminPanelSettings,
  SupervisorAccount,
  VolunteerActivism,
  Person,
  Email,
  Lock,
  Save,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

export default function UserManagement() {
  const { getUsers, register, updateUser, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'volunteer',
    active: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsers();
      if (result.success) {
        setUsers(result.users);
        setError('');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddUser = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'volunteer',
      active: true
    });
    setShowAddDialog(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't prefill password
      role: user.role,
      active: user.active
    });
    setShowEditDialog(true);
  };

  const handleSubmitAdd = async () => {
    setError('');
    setSuccess('');
    
    try {
      const result = await register(formData);
      if (result.success) {
        setSuccess('User added successfully');
        setShowAddDialog(false);
        loadUsers();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to add user');
    }
  };

  const handleSubmitEdit = async () => {
    setError('');
    setSuccess('');
    
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: formData.active
      };
      
      const result = await updateUser(selectedUser.id, updateData);
      if (result.success) {
        setSuccess('User updated successfully');
        setShowEditDialog(false);
        loadUsers();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const handleCloseDialogs = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setSelectedUser(null);
    setError('');
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading users...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {user.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {user.name}
                            {user.id === currentUser?.id && (
                              <Chip 
                                label="You" 
                                size="small" 
                                sx={{ ml: 1 }}
                                color="info"
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={user.role?.toUpperCase()}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.active ? 'Active' : 'Inactive'}
                        color={user.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.createdAt ? format(new Date(user.createdAt), 'PP') : 'Unknown'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user)}
                        disabled={user.id === currentUser?.id} // Can't edit yourself
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                required
                helperText="Must be at least 6 characters"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => handleFormChange('role', e.target.value)}
                >
                  <MenuItem value="volunteer">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VolunteerActivism color="success" />
                      Volunteer
                    </Box>
                  </MenuItem>
                  <MenuItem value="coordinator">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SupervisorAccount color="primary" />
                      Coordinator
                    </Box>
                  </MenuItem>
                  <MenuItem value="admin">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdminPanelSettings color="error" />
                      Admin
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => handleFormChange('active', e.target.checked)}
                  />
                }
                label="Active User"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleSubmitAdd} variant="contained">
            Add User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => handleFormChange('role', e.target.value)}
                >
                  <MenuItem value="volunteer">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VolunteerActivism color="success" />
                      Volunteer
                    </Box>
                  </MenuItem>
                  <MenuItem value="coordinator">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SupervisorAccount color="primary" />
                      Coordinator
                    </Box>
                  </MenuItem>
                  <MenuItem value="admin">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdminPanelSettings color="error" />
                      Admin
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => handleFormChange('active', e.target.checked)}
                  />
                }
                label="Active User"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleSubmitEdit} variant="contained">
            Update User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}