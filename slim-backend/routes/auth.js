// Auth Routes
// Authentication endpoints: login, register, me

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ValidationError, UnauthorizedError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { email, phone, password, name } = req.body;

  // Validation
  if (!password || password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Name is required');
  }
  if (!email && !phone) {
    throw new ValidationError('Email or phone is required');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const query = `
    INSERT INTO users (email, phone, password_hash, name, is_active)
    VALUES ($1, $2, $3, $4, true)
    RETURNING id, email, phone, name, is_active, created_at
  `;
  
  const result = await pool.query(query, [
    email || null,
    phone || null,
    passwordHash,
    name.trim()
  ]);

  const user = result.rows[0];

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      isActive: user.is_active
    },
    token
  });
}));

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  // Validation
  if (!password) {
    throw new ValidationError('Password is required');
  }
  if (!email && !phone) {
    throw new ValidationError('Email or phone is required');
  }

  // Find user
  let query;
  let params;
  
  if (email) {
    query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    params = [email];
  } else {
    query = 'SELECT * FROM users WHERE phone = $1 AND is_active = true';
    params = [phone];
  }

  const result = await pool.query(query, params);
  const user = result.rows[0];

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!validPassword) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      isActive: user.is_active
    },
    token
  });
}));

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const query = 'SELECT id, email, phone, name, is_active, created_at FROM users WHERE id = $1';
  const result = await pool.query(query, [req.user.id]);
  
  const user = result.rows[0];
  
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      isActive: user.is_active,
      createdAt: user.created_at
    }
  });
}));

export default router;
