import express from 'express';
import { authenticateToken } from '../src/middleware/auth.js';
import { 
  getAllFriends, 
  addFriend, 
  updateFriend, 
  addLocationToFriendHistory,
  updateLocationHistory,
  removeLocationHistory,
  deleteFriend,
  getFriendsAtLocation,
  getFriendsLastSeenAt
} from '../models/friend.js';
import { locations } from '../models/location.js';

const router = express.Router();

// Get all friends
router.get('/', authenticateToken, (req, res) => {
  res.json({ friends: getAllFriends(locations) });
});

// Get friends at a specific location (ever or currently)
router.get('/at-location/:locationId', authenticateToken, (req, res) => {
  const { locationId } = req.params;
  const { current } = req.query; // ?current=true for last known location only
  
  const friends = current === 'true' 
    ? getFriendsLastSeenAt(Number(locationId))
    : getFriendsAtLocation(Number(locationId));
    
  res.json({ friends: friends.map(f => getAllFriends(locations).find(ef => ef.id === f.id)) });
});

// Add a friend
router.post('/', authenticateToken, (req, res) => {
  const { name, phone, email, notes, initialLocationId } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  const friend = addFriend(name, phone, email, notes);
  
  // If initial location is provided, add it to history
  if (initialLocationId) {
    addLocationToFriendHistory(friend.id, Number(initialLocationId), "Initial location", new Date().toISOString());
  }
  
  // Return enriched friend data
  const enrichedFriend = getAllFriends(locations).find(f => f.id === friend.id);
  res.status(201).json({ friend: enrichedFriend });
});

// Update a friend's basic info
router.patch('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const friend = updateFriend(Number(id), updates);
  if (!friend) return res.status(404).json({ error: 'Friend not found' });
  
  res.json({ friend });
});

// Add location to friend's history
router.post('/:id/locations', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { locationId, notes, dateRecorded } = req.body;
  
  if (!locationId) return res.status(400).json({ error: 'Location ID required' });
  
  const friend = addLocationToFriendHistory(Number(id), Number(locationId), notes, dateRecorded);
  if (!friend) return res.status(404).json({ error: 'Friend not found' });
  
  res.json({ friend: getAllFriends(locations).find(f => f.id === friend.id) });
});

// Update a specific location history entry
router.patch('/:id/locations/:historyId', authenticateToken, (req, res) => {
  const { id, historyId } = req.params;
  const updates = req.body;
  
  const friend = updateLocationHistory(Number(id), Number(historyId), updates);
  if (!friend) return res.status(404).json({ error: 'Friend or history entry not found' });
  
  res.json({ friend: getAllFriends(locations).find(f => f.id === friend.id) });
});

// Remove a location history entry
router.delete('/:id/locations/:historyId', authenticateToken, (req, res) => {
  const { id, historyId } = req.params;
  
  const friend = removeLocationHistory(Number(id), Number(historyId));
  if (!friend) return res.status(404).json({ error: 'Friend or history entry not found' });
  
  res.sendStatus(204);
});

// Delete a friend
router.delete('/:id', authenticateToken, (req, res) => {
  deleteFriend(Number(req.params.id));
  res.sendStatus(204);
});

export default router;
