import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, authorizeRoles } from '../src/middleware/auth.js';
import userService from '../services/userService.js';

const router = express.Router();

// In-memory storage for users (keeping for backwards compatibility during transition)
export let users = [];

// Get all users (Admin and Coordinator can view)
router.get('/', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create a new user (Admin and Coordinator)
router.post('/', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res) => {
  try {
    const { username, email, password, role, name, phone } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !role || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if username or email already exists
    if (await userService.usernameExists(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    if (await userService.emailExists(email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const user = await userService.createUser({
      username,
      email,
      password_hash,
      role,
      name,
      phone
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update a user (Admin and Coordinator)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'coordinator'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, name, phone } = req.body;
    
    // Check if user exists
    const existingUser = await userService.getUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check for duplicate username/email (excluding current user)
    if (username && await userService.usernameExists(username, id)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    if (email && await userService.emailExists(email, id)) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Update user
    const updatedUser = await userService.updateUser(id, {
      username: username || existingUser.username,
      email: email || existingUser.email,
      role: role || existingUser.role,
      name: name || existingUser.name,
      phone: phone || existingUser.phone
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete a user (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedUser = await userService.deleteUser(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully', user: deletedUser });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
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
