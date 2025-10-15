import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';
import { sampleUsers } from '../../sampleData.js';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth endpoints
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// Use sample users for consistent demo experience 
let users = [...sampleUsers];

let nextUserId = 4;

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Helper function to get user without password
const sanitizeUser = (user) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(401).json({ error: 'Account is inactive. Please contact an administrator.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user info and token
    res.json({
      user: sanitizeUser(user),
      token,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// POST /api/auth/register (Admin and Coordinator)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    // Only admins and coordinators can register new users
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ error: 'Only administrators and coordinators can register new users' });
    }

    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    // Validate role
    const validRoles = ['admin', 'coordinator', 'volunteer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, coordinator, or volunteer' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: nextUserId++,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      createdAt: new Date(),
      active: true
    };

    users.push(newUser);

    // Return sanitized user
    res.status(201).json({
      message: 'User registered successfully',
      user: sanitizeUser(newUser)
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    // Find current user
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    res.json({ user: sanitizeUser(user) });

  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  // For JWT, logout is handled client-side by removing the token
  // In production, you might want to implement token blacklisting
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/users (Admin and Coordinator)
router.get('/users', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ error: 'Only administrators and coordinators can view all users' });
    }

    const sanitizedUsers = users.map(sanitizeUser);
    res.json({ users: sanitizedUsers });

  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/users/:id (Admin and Coordinator)
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
      return res.status(403).json({ error: 'Only administrators and coordinators can modify users' });
    }

    const userId = parseInt(req.params.id);
    const { name, email, role, active } = req.body;

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'coordinator', 'volunteer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
    }

    // Check email uniqueness if changing email
    if (email && email !== users[userIndex].email) {
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== userId);
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
    }

    // Update user
    if (name !== undefined) users[userIndex].name = name;
    if (email !== undefined) users[userIndex].email = email.toLowerCase();
    if (role !== undefined) users[userIndex].role = role;
    if (active !== undefined) users[userIndex].active = active;

    res.json({
      message: 'User updated successfully',
      user: sanitizeUser(users[userIndex])
    });

  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Find user
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    users[userIndex].password = hashedNewPassword;

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;