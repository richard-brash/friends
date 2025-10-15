// Simple database-enabled backend for testing
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { testConnection, initializeSchema } from './database.js';
import { seedDatabase } from './seed.js';
import authRouter from './src/routes/auth.js';
import usersRouter from './routes/users.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// API routes (only auth and users for now)
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

// Health check
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Database seeding endpoints
app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Database backend is working!' });
});

const PORT = process.env.PORT || 4001; // Use different port for testing

async function startServer() {
  try {
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    console.log('🔧 Initializing schema...');
    await initializeSchema();
    
    app.listen(PORT, () => {
      console.log(`🚀 Test backend running on port ${PORT}`);
      console.log('🔗 Test at: http://localhost:' + PORT + '/api/test');
    });
    
  } catch (error) {
    console.error('❌ Failed to start test server:', error);
  }
}

startServer();