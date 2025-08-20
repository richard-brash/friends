import React from "react";
import FriendItem from './FriendItem';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function FriendsList({ friends, locations, routes, onEditFriend, onDeleteFriend, onAddLocationHistory }) {
  if (friends.length === 0) {
    return (
      <Box style={{ padding: 32, textAlign: 'center', color: '#666' }}>
        <Typography variant="h6">No friends added yet</Typography>
        <Typography variant="body2">Add your first friend using the form above</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" style={{ marginBottom: 16 }}>
        Friends ({friends.length})
      </Typography>
      
      {friends.map(friend => (
        <FriendItem
          key={friend.id}
          friend={friend}
          locations={locations}
          routes={routes}
          onEditFriend={onEditFriend}
          onDeleteFriend={onDeleteFriend}
          onAddLocationHistory={onAddLocationHistory}
        />
      ))}
    </Box>
  );
}
