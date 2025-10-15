import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Settings as SettingsIcon,
  People,
  Category,
  Flag,
  Code,
  Add,
  Edit,
  Delete,
  Save,
  Refresh,
  Storage,
  Clear
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import UserManagement from './admin/UserManagement';
import DeveloperTools from './DeveloperTools';

// Default system configurations
const DEFAULT_REQUEST_STATUSES = [
  { id: 'pending', label: 'Pending', color: 'warning', description: 'New request awaiting processing' },
  { id: 'taken', label: 'Taken', color: 'primary', description: 'Request has been taken by a coordinator' },
  { id: 'ready_for_delivery', label: 'Ready for Delivery', color: 'success', description: 'Request is ready to be delivered' },
  { id: 'delivered', label: 'Delivered', color: 'info', description: 'Request has been successfully delivered' },
  { id: 'cancelled', label: 'Cancelled', color: 'error', description: 'Request has been cancelled' }
];

const DEFAULT_PRIORITIES = [
  { id: 'low', label: 'Low', color: 'info', description: 'Standard priority request' },
  { id: 'medium', label: 'Medium', color: 'warning', description: 'Moderate priority request' },
  { id: 'high', label: 'High', color: 'error', description: 'Urgent priority request' }
];

const DEFAULT_CATEGORIES = [
  { id: 'clothing', label: 'Clothing', description: 'Clothing items and accessories' },
  { id: 'non-clothing', label: 'Non-Clothing', description: 'Food, household items, and other necessities' }
];

export default function SettingsPage() {
  const [currentTab, setCurrentTab] = useState(0);
  const [requestStatuses, setRequestStatuses] = useState(DEFAULT_REQUEST_STATUSES);
  const [priorities, setPriorities] = useState(DEFAULT_PRIORITIES);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [dialogType, setDialogType] = useState(''); // 'status', 'priority', 'category'
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const permissions = usePermissions();

  // Form state for add/edit dialogs
  const [formData, setFormData] = useState({
    id: '',
    label: '',
    color: 'default',
    description: ''
  });

  // Build tabs array based on permissions instead of roles
  const tabs = [];
  if (permissions.canManageSettings) {
    tabs.push({ label: 'Request Settings', icon: <Category /> });
  }
  if (permissions.canViewUsers) {
    tabs.push({ label: 'User Management', icon: <People /> });
  }
  if (permissions.canViewDeveloperTools) {
    tabs.push({ label: 'Developer Tools', icon: <Code /> });
  }

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleAddNew = (type) => {
    setDialogType(type);
    setFormData({ id: '', label: '', color: 'default', description: '' });
    setEditItem(null);
    setShowAddDialog(true);
  };

  const handleEdit = (type, item) => {
    setDialogType(type);
    setFormData({ ...item });
    setEditItem(item);
    setShowAddDialog(true);
  };

  const handleDelete = (type, itemId) => {
    switch (type) {
      case 'status':
        setRequestStatuses(prev => prev.filter(s => s.id !== itemId));
        break;
      case 'priority':
        setPriorities(prev => prev.filter(p => p.id !== itemId));
        break;
      case 'category':
        setCategories(prev => prev.filter(c => c.id !== itemId));
        break;
    }
    setSuccess(`${type} deleted successfully`);
  };

  const handleSave = () => {
    if (!formData.id || !formData.label) {
      setError('ID and Label are required');
      return;
    }

    const newItem = { ...formData };

    if (editItem) {
      // Update existing item
      switch (dialogType) {
        case 'status':
          setRequestStatuses(prev => prev.map(s => s.id === editItem.id ? newItem : s));
          break;
        case 'priority':
          setPriorities(prev => prev.map(p => p.id === editItem.id ? newItem : p));
          break;
        case 'category':
          setCategories(prev => prev.map(c => c.id === editItem.id ? newItem : c));
          break;
      }
      setSuccess(`${dialogType} updated successfully`);
    } else {
      // Add new item
      switch (dialogType) {
        case 'status':
          if (requestStatuses.find(s => s.id === newItem.id)) {
            setError('Status ID already exists');
            return;
          }
          setRequestStatuses(prev => [...prev, newItem]);
          break;
        case 'priority':
          if (priorities.find(p => p.id === newItem.id)) {
            setError('Priority ID already exists');
            return;
          }
          setPriorities(prev => [...prev, newItem]);
          break;
        case 'category':
          if (categories.find(c => c.id === newItem.id)) {
            setError('Category ID already exists');
            return;
          }
          setCategories(prev => [...prev, newItem]);
          break;
      }
      setSuccess(`${dialogType} added successfully`);
    }

    setShowAddDialog(false);
    setError('');
  };

  const renderSettingsList = (title, items, type) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => handleAddNew(type)}
            size="small"
          >
            Add {title.replace('Request ', '').replace('s', '')}
          </Button>
        </Box>
        <List>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={item.label}
                        color={item.color || 'default'}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        ({item.id})
                      </Typography>
                    </Box>
                  }
                  secondary={item.description}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(type, item)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(type, item.id)}
                    disabled={items.length <= 1} // Don't allow deleting the last item
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < items.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderRequestSettings = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Request Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure request statuses, priorities, and categories used throughout the system.
      </Typography>

      {renderSettingsList('Request Statuses', requestStatuses, 'status')}
      {renderSettingsList('Request Priorities', priorities, 'priority')}
      {renderSettingsList('Request Categories', categories, 'category')}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Actions</Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={() => setSuccess('Settings saved successfully')}
              >
                Save All Settings
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  setRequestStatuses(DEFAULT_REQUEST_STATUSES);
                  setPriorities(DEFAULT_PRIORITIES);
                  setCategories(DEFAULT_CATEGORIES);
                  setSuccess('Settings reset to defaults');
                }}
              >
                Reset to Defaults
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SettingsIcon color="primary" />
        <Typography variant="h4">
          Settings
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Card>

      {/* Tab Content */}
      <Box>
        {currentTab === 0 && renderRequestSettings()}
        {currentTab === 1 && tabs[1]?.label === 'User Management' && <UserManagement />}
        {((currentTab === 1 && tabs[1]?.label === 'Developer Tools') || 
          (currentTab === 2 && tabs[2]?.label === 'Developer Tools')) && (
          <Box>
            <Typography variant="h5" gutterBottom>Developer Tools</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Advanced tools for development and system maintenance.
            </Typography>
            <DeveloperTools />
          </Box>
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editItem ? `Edit ${dialogType}` : `Add New ${dialogType}`}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ID"
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                disabled={!!editItem} // Can't change ID when editing
                helperText="Unique identifier (lowercase, underscores allowed)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              />
            </Grid>
            {dialogType !== 'category' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Color</InputLabel>
                  <Select
                    value={formData.color}
                    label="Color"
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="primary">Primary (Blue)</MenuItem>
                    <MenuItem value="success">Success (Green)</MenuItem>
                    <MenuItem value="warning">Warning (Orange)</MenuItem>
                    <MenuItem value="error">Error (Red)</MenuItem>
                    <MenuItem value="info">Info (Light Blue)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}