import express from 'express';
const router = express.Router();

// In-memory storage for users
export let users = [];

// Get all users
router.get('/', (req, res) => res.json({ users }));

// Create a new user
router.post('/', (req, res) => {
  const user = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  res.status(201).json(user);
});

// Update a user
router.put('/:id', (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  
  users[index] = { ...users[index], ...req.body };
  res.json(users[index]);
});

// Delete a user
router.delete('/:id', (req, res) => {
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
