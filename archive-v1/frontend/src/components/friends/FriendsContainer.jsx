import React, { useState, useEffect } from "react";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import friendsApi from '../../config/friendsApi.js';
import locationsApi from '../../config/locationsApi.js';
import routesApi from '../../config/routesApi.js';
import AddFriendForm from './AddFriendForm';
import FriendsList from './FriendsList';

export default function FriendsContainer() {
  const [friends, setFriends] = useState([]);
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch friends, locations, and routes using clean architecture
  const fetchData = async () => {
    try {
      console.log('🔄 Using V2 APIs (Clean Architecture)');
      const [friendsRes, locationsRes, routesRes] = await Promise.all([
        friendsApi.getAll(),
        locationsApi.getAll(),
        routesApi.getAll()
      ]);
      
      const friendsData = friendsRes.data || [];
      const locationsData = locationsRes.data || [];
      const routesData = routesRes.data || [];
      
      console.log('✅ V2 APIs response:', friendsData.length, 'friends,', locationsData.length, 'locations,', routesData.length, 'routes loaded');
      setFriends(friendsData);
      setLocations(locationsData);
      setRoutes(routesData);
      setError("");
    } catch (err) {
      console.error('❌ API error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add friend with optimistic update using V2 API  
  const handleAddFriend = async (friendData, initialLocationId = null) => {
    const tempId = Date.now();
    const tempFriend = { 
      id: tempId, 
      ...friendData, 
      requests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Optimistic update
    setFriends(prev => [...prev, tempFriend]);
    
    try {
      // Transform data to match V2 API format
      const requestData = {
        name: friendData.name,
        nickname: friendData.nickname || null,
        email: friendData.email || null,
        phone: friendData.phone || null,
        notes: friendData.notes || null,
        clothingSizes: friendData.clothingSizes || null,
        dietaryRestrictions: friendData.dietaryRestrictions || null,
        currentLocationId: initialLocationId || null
      };
      
      console.log('🔄 Creating friend with V2 API:', requestData);
      const res = await friendsApi.create(requestData);
      
      // Fetch the complete friend data (including current location) instead of using create response
      const completeRes = await friendsApi.getById(res.data.id);
      
      // Replace temp friend with complete friend data
      setFriends(prev => prev.map(f => f.id === tempId ? completeRes.data : f));
      console.log('✅ Friend created successfully with location info:', completeRes.data);
      
    } catch (err) {
      console.error('❌ Failed to create friend:', err);
      // Rollback on error
      setFriends(prev => prev.filter(f => f.id !== tempId));
      setError(err.message);
    }
  };

  // Update friend with optimistic update using V2 API
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
      console.log('🔄 Updating friend with V2 API:', friendId, updates);
      const res = await friendsApi.update(friendId, updates);
      
      // Update with server response
      setFriends(prev => prev.map(f => f.id === friendId ? res.data : f));
      console.log('✅ Friend updated successfully:', res.data);
    } catch (err) {
      console.error('❌ Failed to update friend:', err);
      // Rollback on error
      setFriends(prev => prev.map(f => f.id === friendId ? oldFriend : f));
      setError(err.message);
    }
  };

  // Add location to friend's history
  const handleAddLocationHistory = async (friendId, locationId, notes = "") => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;
    
    const currentTimestamp = new Date().toISOString();
    const tempHistoryEntry = {
      id: Date.now(),
      locationId,
      dateRecorded: currentTimestamp,
      notes,
      locationName: locations.find(l => l.id === locationId)?.name || 'Unknown'
    };
    
    // Optimistic update
    setFriends(prev => prev.map(f => 
      f.id === friendId 
        ? { 
            ...f, 
            locationHistory: [...(f.locationHistory || []), tempHistoryEntry],
            lastKnownLocation: {
              ...locations.find(l => l.id === locationId),
              dateRecorded: currentTimestamp,
              notes: tempHistoryEntry.notes
            }
          }
        : f
    ));
    
    try {
      // Add location history using V2 API
      const locationData = {
        locationId: parseInt(locationId),
        notes: notes || null
        // dateRecorded removed - backend will always use current timestamp
      };
      
      console.log('🔄 Adding location history with V2 API:', friendId, locationData);
      const res = await friendsApi.addLocationHistory(friendId, locationData);
      
      // Fetch updated friend data to get the complete info including new current location
      const updatedFriendRes = await friendsApi.getById(friendId);
      
      // Update the friend in the list with the complete updated data
      setFriends(prev => prev.map(f => 
        f.id === friendId ? updatedFriendRes.data : f
      ));
      
      console.log('✅ Location history added successfully:', res.data);
    } catch (err) {
      // Rollback on error
      setFriends(prev => prev.map(f => 
        f.id === friendId 
          ? { 
              ...f, 
              locationHistory: (f.locationHistory || []).filter(h => h.id !== tempHistoryEntry.id)
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
      await friendsApi.delete(friendId);
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
