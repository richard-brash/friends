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
  ListItemSecondaryAction,
  Checkbox,
  Avatar,
  Typography,
  Box,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import { Person, Group } from '@mui/icons-material';

const API_BASE = 'http://localhost:4000/api';

export default function ManageTeamDialog({ open, onClose, runId, onTeamUpdated }) {
  const [run, setRun] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    if (open && runId) {
      fetchData();
    }
  }, [open, runId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [runRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/runs/${runId}`),
        fetch(`${API_BASE}/users`)
      ]);

      const runData = await runRes.json();
      const usersData = await usersRes.json();

      if (runData.run) {
        setRun(runData.run);
        setSelectedUsers(runData.run.assignedUserIds || []);
      }
      setUsers(usersData.users || []);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId) => {
    const isCurrentlySelected = selectedUsers.includes(userId);
    const isLead = userId === run?.leadId;
    
    // Lead must always be assigned
    if (isLead && isCurrentlySelected) {
      return;
    }

    if (isCurrentlySelected) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/runs/${runId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...run,
          assignedUserIds: selectedUsers
        })
      });

      if (response.ok) {
        const updatedRun = await response.json();
        onTeamUpdated(updatedRun);
        onClose();
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to update team');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (id) => users.find(u => u.id.toString() === id.toString());
  const lead = getUserById(run?.leadId);
  
  // Filter users who can participate in runs
  const eligibleUsers = users.filter(u => 
    u.permissions && (
      u.permissions.includes('participate_runs') || 
      u.permissions.includes('lead_runs') || 
      u.permissions.includes('coordinate_runs')
    )
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Group />
        Manage Team Members
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {run && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Team Size: {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''}
            </Typography>
            
            {lead && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Person color="primary" />
                <Typography variant="body2">
                  Lead: {lead.name}
                </Typography>
                <Chip label="Required" size="small" color="primary" />
              </Box>
            )}
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Available Team Members:
        </Typography>

        <List>
          {eligibleUsers.map((user) => {
            const isSelected = selectedUsers.includes(user.id);
            const isLead = user.id === run?.leadId;
            const canToggle = !isLead || !isSelected; // Lead can be added but not removed

            return (
              <ListItem
                key={user.id}
                dense
                button={canToggle}
                onClick={canToggle ? () => handleUserToggle(user.id) : undefined}
                sx={{
                  bgcolor: isLead ? 'primary.50' : 'transparent',
                  borderRadius: 1,
                  mb: 0.5
                }}
              >
                <Avatar sx={{ mr: 2 }}>
                  {user.name[0]}
                </Avatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{user.name}</Typography>
                      {isLead && <Chip label="Lead" size="small" color="primary" />}
                    </Box>
                  }
                  secondary={`${user.role} • ${user.permissions?.join(', ') || 'No permissions'}`}
                />
                <ListItemSecondaryAction>
                  <Checkbox
                    edge="end"
                    checked={isSelected}
                    disabled={isLead && isSelected} // Can't uncheck lead
                    onChange={() => canToggle && handleUserToggle(user.id)}
                    color={isLead ? "primary" : "default"}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>

        {eligibleUsers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No eligible users found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Users need 'participate_runs', 'lead_runs', or 'coordinate_runs' permission
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading || selectedUsers.length === 0}
        >
          {loading ? 'Saving...' : 'Save Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}