import React, { useState, useEffect } from "react";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
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
        fetch('/api/friends'),
        fetch('/api/locations'),
        fetch('/api/routes')
      ]);
      
      if (!friendsRes.ok || !locationsRes.ok || !routesRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const friendsData = await friendsRes.json();
      const locationsData = await locationsRes.json();
      const routesData = await routesRes.json();
      
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
      
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      if (!res.ok) throw new Error('Failed to add friend');
      const data = await res.json();
      
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
      const res = await fetch(`/api/friends/${friendId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!res.ok) throw new Error('Failed to update friend');
      const data = await res.json();
      
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
      const res = await fetch(`/api/friends/${friendId}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, notes, dateRecorded })
      });
      
      if (!res.ok) throw new Error('Failed to add location history');
      const data = await res.json();
      
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
      const res = await fetch(`/api/friends/${friendId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete friend');
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
