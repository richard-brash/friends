import React, { useState, useEffect } from "react";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import axios from 'axios';
import AddFriendForm from './AddFriendForm';
import FriendsList from './FriendsList';

export default function FriendsContainer() {
  const [friends, setFriends] = useState([]);
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch friends, locations, and routes
  const fetchData = async () => {
    try {
      const [friendsRes, locationsRes, routesRes] = await Promise.all([
        axios.get('/api/friends'),
        axios.get('/api/locations'),
        axios.get('/api/routes')
      ]);
      
      const friendsData = friendsRes.data;
      const locationsData = locationsRes.data;
      const routesData = routesRes.data;
      
      setFriends(friendsData.friends || []);
      setLocations(locationsData.locations || []);
      setRoutes(routesData.routes || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add friend with optimistic update
  const handleAddFriend = async (friendData, initialLocationId = null) => {
    const tempId = Date.now();
    const tempFriend = { 
      id: tempId, 
      ...friendData, 
      locationHistory: [],
      lastKnownLocation: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Optimistic update
    setFriends(prev => [...prev, tempFriend]);
    
    try {
      // Include initial location in the friend creation request
      const requestData = {
        ...friendData,
        ...(initialLocationId && { initialLocationId })
      };
      
      const res = await axios.post('/api/friends', requestData);
      const data = res.data;
      
      // Replace temp friend with real one (already includes location if provided)
      setFriends(prev => prev.map(f => f.id === tempId ? data.friend : f));
      
    } catch (err) {
      // Rollback on error
      setFriends(prev => prev.filter(f => f.id !== tempId));
      setError(err.message);
    }
  };

  // Update friend with optimistic update
  const handleEditFriend = async (friendId, updates) => {
    const oldFriend = friends.find(f => f.id === friendId);
    if (!oldFriend) return;
    
    // Optimistic update
    setFriends(prev => prev.map(f => 
      f.id === friendId 
        ? { ...f, ...updates, updatedAt: new Date().toISOString() }
        : f
    ));
    
    try {
      const res = await axios.patch(`/api/friends/${friendId}`, updates);
      const data = res.data;
      
      // Update with server response
      setFriends(prev => prev.map(f => f.id === friendId ? data.friend : f));
    } catch (err) {
      // Rollback on error
      setFriends(prev => prev.map(f => f.id === friendId ? oldFriend : f));
      setError(err.message);
    }
  };

  // Add location to friend's history
  const handleAddLocationHistory = async (friendId, locationId, notes = "", dateRecorded = null) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;
    
    const tempHistoryEntry = {
      id: Date.now(),
      locationId,
      dateRecorded: dateRecorded || new Date().toISOString(),
      notes,
      locationName: locations.find(l => l.id === locationId)?.description || 'Unknown'
    };
    
    // Optimistic update
    setFriends(prev => prev.map(f => 
      f.id === friendId 
        ? { 
            ...f, 
            locationHistory: [...f.locationHistory, tempHistoryEntry],
            lastKnownLocation: {
              ...locations.find(l => l.id === locationId),
              dateRecorded: tempHistoryEntry.dateRecorded,
              notes: tempHistoryEntry.notes
            }
          }
        : f
    ));
    
    try {
      const res = await axios.post(`/api/friends/${friendId}/locations`, {
        locationId, notes, dateRecorded
      });
      const data = res.data;
      
      // Update with server response
      setFriends(prev => prev.map(f => f.id === friendId ? data.friend : f));
    } catch (err) {
      // Rollback on error
      setFriends(prev => prev.map(f => 
        f.id === friendId 
          ? { 
              ...f, 
              locationHistory: f.locationHistory.filter(h => h.id !== tempHistoryEntry.id)
            }
          : f
      ));
      setError(err.message);
    }
  };

  // Delete friend with optimistic update
  const handleDeleteFriend = async (friendId) => {
    const oldFriend = friends.find(f => f.id === friendId);
    if (!oldFriend || !window.confirm(`Delete ${oldFriend.name}?`)) return;
    
    // Optimistic update
    setFriends(prev => prev.filter(f => f.id !== friendId));
    
    try {
      await axios.delete(`/api/friends/${friendId}`);
    } catch (err) {
      // Rollback on error
      setFriends(prev => [...prev, oldFriend]);
      setError(err.message);
    }
  };

  if (loading) {
    return <Typography>Loading friends...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Friends Management
      </Typography>
      
      {error && (
        <Alert severity="error" style={{ marginBottom: 16 }}>
          {error}
        </Alert>
      )}
      
      <AddFriendForm 
        onAdd={handleAddFriend} 
        locations={locations}
        routes={routes}
      />
      
      <FriendsList 
        friends={friends}
        locations={locations}
        routes={routes}
        onEditFriend={handleEditFriend}
        onDeleteFriend={handleDeleteFriend}
        onAddLocationHistory={handleAddLocationHistory}
      />
    </Box>
  );
}
