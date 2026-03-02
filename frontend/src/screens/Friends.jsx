import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { friendsAPI } from '../api/client';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await friendsAPI.getAll();
      const friendsData = Array.isArray(response.data.data) ? response.data.data : [];
      setFriends(friendsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load friends');
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Friends
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Friend
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <List>
        {friends.map((friend) => (
          <ListItem
            key={friend.id}
            divider
            sx={{
              bgcolor: 'background.paper',
              mb: 1,
              borderRadius: 1,
            }}
          >
            <ListItemText
              primary={friend.displayName}
              secondary={
                <Box component="span">
                  {friend.phone && <Typography component="span" variant="body2" display="block">{friend.phone}</Typography>}
                  {friend.updatedAt && (
                    <Typography component="span" variant="caption" color="text.secondary">
                      Last updated: {new Date(friend.updatedAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton edge="end">
                <EditIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {friends.length === 0 && !error && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No friends yet
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }}>
            Add Your First Friend
          </Button>
        </Box>
      )}
    </Container>
  );
}
