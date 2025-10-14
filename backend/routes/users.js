import express from 'express';
import { authenticateToken, authorizeRoles } from '../src/middleware/auth.js';
const router = express.Router();

// In-memory storage for users
export let users = [];

// Get all users (Admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), (req, res) => res.json({ users }));

// Create a new user (Admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const user = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  res.status(201).json(user);
});

// Update a user (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  
  users[index] = { ...users[index], ...req.body };
  res.json(users[index]);
});

// Delete a user (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  
  users.splice(index, 1);
  res.json({ message: 'User deleted' });
});

// Seed users (for sample data)
router.post('/seed', (req, res) => {
  users.push(...req.body);
  res.json({ message: `${req.body.length} users seeded` });
});

// Clear all users
router.delete('/all', (req, res) => {
  users.length = 0;
  res.json({ message: 'All users cleared' });
});

export default router;
