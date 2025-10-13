import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
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
  Paper
} from '@mui/material';
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

const API_BASE = 'http://localhost:4000/api';

export default function RunsList({ onCreateRun, onViewRun, onEditRun }) {
  const [runs, setRuns] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [runsRes, routesRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/runs`),
        fetch(`${API_BASE}/routes`),
        fetch(`${API_BASE}/users`)
      ]);

      const runsData = await runsRes.json();
      const routesData = await routesRes.json();
      const usersData = await usersRes.json();

      setRuns(runsData.runs || []);
      setRoutes(routesData.routes || []);
      setUsers(usersData.users || []);
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
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return 'Past';
    return format(date, 'MMM d');
  };

  const getUserById = (id) => users.find(u => u.id.toString() === id.toString());
  const getRouteById = (id) => routes.find(r => r.id.toString() === id.toString());

  const handleMenuOpen = (event, run) => {
    setAnchorEl(event.currentTarget);
    setSelectedRun(run);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRun(null);
  };

  const handleDeleteRun = async () => {
    if (!selectedRun) return;
    
    try {
      await fetch(`${API_BASE}/runs/${selectedRun.id}`, { method: 'DELETE' });
      setRuns(runs.filter(r => r.id !== selectedRun.id));
      handleMenuClose();
    } catch (err) {
      setError('Failed to delete run');
    }
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
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onCreateRun}
        >
          Schedule New Run
        </Button>
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
          const route = getRouteById(run.routeId);
          const lead = getUserById(run.leadId);
          const coordinator = getUserById(run.coordinatorId);
          const assignedCount = run.assignedUserIds?.length || 0;
          
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
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {route?.name || 'Unknown Route'}
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

                  {/* Date and Time */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Schedule color="action" />
                    <Box>
                      <Typography variant="body2">
                        {getDateLabel(run.scheduledDate)} • {format(new Date(run.scheduledDate), 'h:mm a')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(run.scheduledDate), 'EEEE, MMM d')}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Lead and Team */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Person color="action" />
                    <Typography variant="body2">
                      Lead: {lead?.name || 'Unassigned'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Group color="action" />
                    <Typography variant="body2">
                      Team: {assignedCount} member{assignedCount !== 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  {/* Meals */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <RestaurantMenu color="action" />
                    <Typography variant="body2">
                      {run.mealsCount} meals
                    </Typography>
                  </Box>

                  {/* Locations */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LocationOn color="action" />
                    <Typography variant="body2">
                      {route?.locationIds?.length || 0} location{(route?.locationIds?.length || 0) !== 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  {/* Progress for in-progress/completed runs */}
                  {(run.status === 'in_progress' || run.status === 'completed') && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Progress: {run.currentLocationIndex || 0} / {route?.locationIds?.length || 0}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          route?.locationIds?.length > 0 
                            ? ((run.currentLocationIndex || 0) / route.locationIds.length) * 100 
                            : 0
                        }
                        sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  )}

                  {/* Coordinator Notes Preview */}
                  {run.coordinatorNotes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                      "{run.coordinatorNotes.substring(0, 80)}{run.coordinatorNotes.length > 80 ? '...' : ''}"
                    </Typography>
                  )}
                </CardContent>

                <CardActions>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); onViewRun(run.id); }}>
                    View Details
                  </Button>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); onEditRun(run.id); }}>
                    Edit
                  </Button>
                </CardActions>
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
              Schedule your first outreach run to get started
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={onCreateRun}>
              Schedule New Run
            </Button>
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
                  const route = getRouteById(run.routeId);
                  const lead = getUserById(run.leadId);
                  const assignedCount = run.assignedUserIds?.length || 0;
                  
                  return (
                    <TableRow key={run.id} hover onClick={() => onViewRun(run.id)} sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {route?.name || 'Unknown Route'}
                        </Typography>
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
                          {lead?.name || 'Unassigned'}
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
                          {assignedCount} member{assignedCount !== 1 ? 's' : ''}
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
        <MenuItem onClick={() => { onEditRun(selectedRun?.id); handleMenuClose(); }}>
          Edit Run
        </MenuItem>
        <MenuItem onClick={() => { onViewRun(selectedRun?.id); handleMenuClose(); }}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleDeleteRun} sx={{ color: 'error.main' }}>
          Delete Run
        </MenuItem>
      </Menu>
    </Box>
  );
}