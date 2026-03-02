// Express Server - Friends Outreach CRM V2
// Main entry point

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Friends Outreach CRM V2 API',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      friends: '/api/friends',
      routes: '/api/routes',
      locations: '/api/locations',
      runs: '/api/runs',
      requests: '/api/requests'
    }
  });
});

// Mount route handlers
import authRoutes from './routes/auth.js';
import friendRoutes from './routes/friends.js';
import routeRoutes from './routes/routes.js';
import locationRoutes from './routes/locations.js';
import requestRoutes from './routes/requests.js';
import runRoutes from './routes/runs.js';

app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/runs', runRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n👋 SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n👋 SIGINT received, closing server...');
  await pool.end();
  process.exit(0);
});
