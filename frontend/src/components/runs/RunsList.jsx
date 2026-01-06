import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar
} from '@mui/material';
import ConfirmDialog from '../common/ConfirmDialog';
import {
  Add,
  MoreVert,
  Schedule,
  PlayArrow,
  CheckCircle,
  Cancel,
  Person,
  LocationOn,
  RestaurantMenu,
  Group
} from '@mui/icons-material';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { API_BASE } from '../../config/api.js';
import { usePermissions } from '../../hooks/usePermissions';
import runsApi from '../../config/runsApi.js';

// Using V2 API with clean architecture and proper date formatting

export default function RunsList({ onCreateRun, onViewRun, onEditRun }) {
  const permissions = usePermissions();
  const [runs, setRuns] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch runs using V2 API with clean architecture
      // Use includeTeam query param to get full team member details
      console.log('🔄 Using V2 Clean Architecture API');
      const [runsRes, routesRes] = await Promise.all([
        axios.get(`${API_BASE}/v2/runs?includeTeam=true`),
        axios.get(`${API_BASE}/v2/routes`)
      ]);
      
      const runs = runsRes.data?.data || runsRes.data || [];
      const routes = routesRes.data?.data || routesRes.data?.routes || [];
      console.log('✅ V2 API runs received:', runs.length, runs[0]);
      setRuns(runs);
      setRoutes(routes);

      // Try to fetch users (only admins/coordinators can access)
      try {
        const usersRes = await axios.get(`${API_BASE}/users`);
        setUsers(usersRes.data.users || []);
      } catch (userErr) {
        // If user fetch fails (volunteers), continue without user data
        console.log('Cannot fetch users (insufficient permissions)');
        setUsers([]);
      }
      
    } catch (err) {
      setError('Failed to load runs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Schedule />;
      case 'in_progress': return <PlayArrow />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      default: return <Schedule />;
    }
  };

  const getDateLabel = (dateString) => {
    if (!dateString) return 'No Date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return 'Past';
    return format(date, 'MMM d');
  };

  const getUserById = (id) => {
    if (!id) return { id, name: `User ${id}`, email: '' };
    const user = users.find(u => u.id && u.id.toString() === id.toString());
    return user || { id, name: `User ${id}`, email: '' }; // Fallback for volunteers
  };
  const getRouteById = (id) => {
    if (!id) return null;
    return routes.find(r => r.id && r.id.toString() === id.toString());
  };

  const handleMenuOpen = (event, run) => {
    setAnchorEl(event.currentTarget);
    setSelectedRun(run);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selectedRun here - it's needed for the confirmation dialog
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRun) return;
    
    try {
      await axios.delete(`${API_BASE}/v2/runs/${selectedRun.id}`);
      setRuns(runs.filter(r => r.id !== selectedRun.id));
      setConfirmDelete(false);
      setSelectedRun(null); // Clear after successful delete
      setSnackbar({ open: true, message: 'Run deleted successfully', severity: 'success' });
    } catch (err) {
      setConfirmDelete(false);
      setSelectedRun(null); // Clear after error
      setSnackbar({ open: true, message: 'Failed to delete run', severity: 'error' });
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(false);
    setSelectedRun(null); // Clear on cancel
  };

  // Separate active runs (scheduled/in_progress) from completed/cancelled
  const activeRuns = runs
    .filter(run => run.status === 'scheduled' || run.status === 'in_progress')
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  
  const completedRuns = runs
    .filter(run => run.status === 'completed' || run.status === 'cancelled')
    .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading runs...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Outreach Runs
        </Typography>
        {/* Only show Schedule New Run button if user has permission */}
        {permissions.canScheduleRuns && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateRun}
          >
            Schedule New Run
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Active Runs Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Active Runs ({activeRuns.length})
        </Typography>
        <Grid container spacing={3}>
          {activeRuns.map((run) => {
          // Get full route object from routes array (run.route only has name/color)
          const route = routes.find(r => r.id === run.routeId);
          
          // V2 API list endpoint returns aggregate data, not full team array
          const leadName = run.createdByName || 'Unassigned';
          const teamCount = run.teamSize || 0;
          
          // Get location count from full route object
          const locationCount = route?.locationCount || 0;
          
          return (
            <Grid item xs={12} sm={6} lg={4} key={run.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => onViewRun(run.id)}
              >
                <CardContent sx={{ flex: 1 }}>
                  {/* Header - Route Name and Date */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {route?.name || 'Unnamed Route'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {(() => {
                          try {
                            const date = new Date(run.scheduledDate);
                            if (isNaN(date.getTime())) {
                              return 'Invalid date';
                            }
                            return format(date, 'EEEE, MMM d, yyyy');
                          } catch (error) {
                            console.error('Date formatting error:', error);
                            return 'Date error';
                          }
                        })()}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(run.status)}
                        label={run.status?.toUpperCase()}
                        color={getStatusColor(run.status)}
                        size="small"
                      />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, run);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  {/* Team Members */}
                  {run.team && run.team.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Group color="action" />
                        <Typography variant="body2" fontWeight="medium">
                          Team ({run.team.length})
                        </Typography>
                      </Box>
                      <Box component="ul" sx={{ 
                        pl: 4, 
                        my: 0,
                        '& li': { 
                          fontSize: '0.875rem',
                          color: 'text.secondary',
                          lineHeight: 1.6
                        }
                      }}>
                        {run.team.map((member, index) => {
                          const memberName = member.name || member.userName || member.user_name || `User ${member.userId || member.user_id}`;
                          return (
                            <li key={member.userId || member.user_id || index}>
                              {memberName}
                            </li>
                          );
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* Meals */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <RestaurantMenu color="action" />
                    <Typography variant="body2">
                      {run.mealCount || 0} meal{(run.mealCount || 0) !== 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  {/* Locations */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LocationOn color="action" />
                    <Typography variant="body2">
                      {locationCount} location{locationCount !== 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  {/* Progress for in-progress/completed runs */}
                  {(run.status === 'in_progress' || run.status === 'completed') && locationCount > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Progress: {run.currentLocationIndex || 0} / {locationCount}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          locationCount > 0 
                            ? ((run.currentLocationIndex || 0) / locationCount) * 100 
                            : 0
                        }
                        sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  )}

                  {/* Coordinator Notes Preview */}
                  {run.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                      "{run.notes.substring(0, 80)}{run.notes.length > 80 ? '...' : ''}"
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
          })}
        </Grid>

        {activeRuns.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No active runs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {permissions.canScheduleRuns
                ? 'Schedule your first outreach run to get started'
                : 'No active runs scheduled at this time'
              }
            </Typography>
            {/* Only show Schedule New Run button if user has permission */}
            {permissions.canScheduleRuns && (
              <Button variant="contained" startIcon={<Add />} onClick={onCreateRun}>
                Schedule New Run
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Completed Runs Table */}
      {completedRuns.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Completed Runs ({completedRuns.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Route</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Lead</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Team Size</TableCell>
                  <TableCell>Contacts Made</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {completedRuns.map((run) => {
                  // Get full route object from routes array
                  const route = routes.find(r => r.id === run.routeId);
                  const leadName = run.createdByName || 'Unassigned';
                  const teamCount = run.teamSize || 0;
                  
                  return (
                    <TableRow key={run.id} hover onClick={() => onViewRun(run.id)} sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {run.name || route?.name || 'Unnamed Run'}
                        </Typography>
                        {route?.name && run.name !== route.name && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Route: {route.name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(run.scheduledDate), 'MMM d, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(run.scheduledDate), 'h:mm a')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {leadName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(run.status)}
                          label={run.status?.toUpperCase()}
                          color={getStatusColor(run.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {teamCount} member{teamCount !== 1 ? 's' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {run.contactsMade || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, run);
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onViewRun(selectedRun?.id); handleMenuClose(); }}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          Delete Run
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Run?"
        message={`Are you sure you want to delete this run? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}