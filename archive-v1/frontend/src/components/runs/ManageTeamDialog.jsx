import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Divider,
  Alert,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Group, PersonAdd, PersonRemove, Star } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE } from '../../config/api.js';

// V2 API with Clean Architecture
// Props: run object (not runId), onTeamUpdated callback
// Team members are added/removed immediately via API calls (no Save button)
// First team member added (ORDER BY created_at ASC) is automatically the run lead
export default function ManageTeamDialog({ open, onClose, run, onTeamUpdated }) {
  const [users, setUsers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (open && run) {
      fetchData();
    }
  }, [open, run?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all users and current team members
      const [usersRes, teamRes] = await Promise.all([
        axios.get(`${API_BASE}/users`),
        axios.get(`${API_BASE}/v2/runs/${run.id}/team-members`)
      ]);

      const usersData = usersRes.data?.users || usersRes.data || [];
      const teamData = teamRes.data?.data || teamRes.data?.teamMembers || [];
      
      setUsers(usersData);
      setTeamMembers(teamData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load team data: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      setActionLoading({ ...actionLoading, [userId]: 'adding' });
      setError('');
      
      await axios.post(`${API_BASE}/v2/runs/${run.id}/team-members`, {
        userId: userId
      });
      
      // Refresh team data
      await fetchData();
      
      // Notify parent to refresh run data
      if (onTeamUpdated) {
        onTeamUpdated();
      }
    } catch (err) {
      console.error('Failed to add member:', err);
      setError('Failed to add team member: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading({ ...actionLoading, [userId]: null });
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      setActionLoading({ ...actionLoading, [userId]: 'removing' });
      setError('');
      
      await axios.delete(`${API_BASE}/v2/runs/${run.id}/team-members/${userId}`);
      
      // Refresh team data
      await fetchData();
      
      // Notify parent to refresh run data
      if (onTeamUpdated) {
        onTeamUpdated();
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError('Failed to remove team member: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading({ ...actionLoading, [userId]: null });
    }
  };

  const handleClose = () => {
    // Clear state and close
    setError('');
    setActionLoading({});
    onClose();
  };

  // Filter users who can participate in runs
  const eligibleUsers = users.filter(u => 
    u.role && ['admin', 'coordinator', 'volunteer'].includes(u.role)
  );

  // Get user IDs currently on team
  const teamUserIds = teamMembers.map(tm => tm.userId || tm.user_id);

  // Available users (not on team)
  const availableUsers = eligibleUsers.filter(u => 
    !teamUserIds.includes(u.id)
  );

  // First team member is the lead (ordered by created_at ASC in backend)
  const leadUserId = teamMembers[0]?.userId || teamMembers[0]?.user_id;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Group />
        Manage Team Members
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          The first team member added becomes the run lead automatically.
        </Alert>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Current Team Members */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Current Team ({teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''})
              </Typography>
              
              {teamMembers.length > 0 ? (
                <List>
                  {teamMembers.map((member, index) => {
                    const isLead = index === 0; // First member is lead
                    const userId = member.userId || member.user_id;
                    const userName = member.name || member.userName || `User ${userId}`;
                    const userEmail = member.email || member.userEmail || '';
                    const userRole = member.role || member.userRole || 'volunteer';
                    
                    return (
                      <ListItem
                        key={userId}
                        sx={{
                          bgcolor: isLead ? 'primary.50' : 'grey.50',
                          borderRadius: 1,
                          mb: 1,
                          border: '1px solid',
                          borderColor: isLead ? 'primary.200' : 'grey.200'
                        }}
                      >
                        <Avatar sx={{ mr: 2, bgcolor: isLead ? 'primary.main' : 'grey.500' }}>
                          {isLead ? <Star /> : userName[0]}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography>{userName}</Typography>
                              {isLead && <Chip label="Lead" size="small" color="primary" />}
                            </Box>
                          }
                          secondary={`${userRole} ${userEmail ? `• ${userEmail}` : ''}`}
                        />
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleRemoveMember(userId)}
                          disabled={actionLoading[userId] === 'removing'}
                          title="Remove from team"
                        >
                          {actionLoading[userId] === 'removing' ? (
                            <CircularProgress size={20} />
                          ) : (
                            <PersonRemove />
                          )}
                        </IconButton>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography color="text.secondary">
                    No team members assigned yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add members below to build your team
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Available Users */}
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Available Team Members ({availableUsers.length})
              </Typography>
              
              {availableUsers.length > 0 ? (
                <List>
                  {availableUsers.map((user) => (
                    <ListItem
                      key={user.id}
                      sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'grey.300'
                      }}
                    >
                      <Avatar sx={{ mr: 2 }}>
                        {user.name[0]}
                      </Avatar>
                      <ListItemText
                        primary={user.name}
                        secondary={`${user.role} ${user.email ? `• ${user.email}` : ''}`}
                      />
                      <IconButton
                        edge="end"
                        color="primary"
                        onClick={() => handleAddMember(user.id)}
                        disabled={actionLoading[user.id] === 'adding'}
                        title="Add to team"
                      >
                        {actionLoading[user.id] === 'adding' ? (
                          <CircularProgress size={20} />
                        ) : (
                          <PersonAdd />
                        )}
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography color="text.secondary">
                    {teamMembers.length > 0 
                      ? 'All eligible users are already on the team'
                      : 'No eligible users found'
                    }
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
