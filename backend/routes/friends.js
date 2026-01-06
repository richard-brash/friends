import express from 'express';
import { authenticateToken } from '../src/middleware/auth.js';
import friendService from '../services/friendService.js';

const router = express.Router();

// Get all friends
router.get('/', authenticateToken, async (req, res) => {
  try {
    const friends = await friendService.getAllFriends();
    res.json({ friends });
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Get friends at a specific location
router.get('/at-location/:locationId', authenticateToken, async (req, res) => {
  try {
    const { locationId } = req.params;
    const friends = await friendService.getFriendsByLocationId(Number(locationId));
    res.json({ friends });
  } catch (error) {
    console.error('Error getting friends by location:', error);
    res.status(500).json({ error: 'Failed to get friends by location' });
  }
});

// Get a specific friend with details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const friend = await friendService.getFriendById(Number(id));
    if (!friend) return res.status(404).json({ error: 'Friend not found' });
    res.json({ friend });
  } catch (error) {
    console.error('Error getting friend:', error);
    res.status(500).json({ error: 'Failed to get friend' });
  }
});

// Add a friend
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, nickname, notes, current_location_id, clothing_sizes, dietary_restrictions } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    
    const friend = await friendService.createFriend({
      name,
      nickname,
      notes,
      current_location_id,
      clothing_sizes,
      dietary_restrictions
    });
    
    res.status(201).json({ friend });
  } catch (error) {
    console.error('Error creating friend:', error);
    res.status(500).json({ error: 'Failed to create friend' });
  }
});

// Update a friend's basic info
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const friend = await friendService.updateFriend(Number(id), updates);
    if (!friend) return res.status(404).json({ error: 'Friend not found' });
    
    res.json({ friend });
  } catch (error) {
    console.error('Error updating friend:', error);
    res.status(500).json({ error: 'Failed to update friend' });
  }
});

// Delete a friend
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFriend = await friendService.deleteFriend(Number(id));
    if (!deletedFriend) return res.status(404).json({ error: 'Friend not found' });
    
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting friend:', error);
    res.status(500).json({ error: 'Failed to delete friend' });
  }
});

// Search friends by name
router.get('/search/:term', authenticateToken, async (req, res) => {
  try {
    const { term } = req.params;
    const friends = await friendService.searchFriendsByName(term);
    res.json({ friends });
  } catch (error) {
    console.error('Error searching friends:', error);
    res.status(500).json({ error: 'Failed to search friends' });
  }
});

export default router;
