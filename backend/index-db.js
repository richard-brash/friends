require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Database setup
const { testConnection, initializeSchema } = require('./database');
const { resetAndSeed, seedDatabase } = require('./seed');

// Import routers (we'll need to convert these to use services)
const authRouter = require('./src/routes/auth.js');
const usersRouter = require('./routes/users.js');
const friendsRouter = require('./routes/friends.js');
const locationsRouter = require('./routes/locations.js');
const routesRouter = require('./routes/routes.js');
const runsRouter = require('./routes/runs.js');
const requestsRouter = require('./routes/requests.js');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// API routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/routes', routesRouter);
app.use('/api/runs', runsRouter);
app.use('/api/requests', requestsRouter);

// Database management endpoints for Developer Tools
app.post('/api/seed', async (req, res) => {
  try {
    console.log('🌱 Seeding database via API...');
    await seedDatabase();
    
    res.json({ 
      message: 'Database seeded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    res.status(500).json({ 
      error: 'Failed to seed database', 
      details: error.message 
    });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    console.log('🔄 Resetting database via API...');
    await resetAndSeed();
    
    res.json({ 
      message: 'Database reset and seeded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    res.status(500).json({ 
      error: 'Failed to reset database', 
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from frontend dist (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Handle React routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Failed to connect to database. Please check your DATABASE_URL.');
      process.exit(1);
    }
    
    console.log('🔧 Initializing database schema...');
    await initializeSchema();
    
    console.log('🌱 Checking if database needs initial seeding...');
    // In production, we might want to check if data exists before seeding
    if (process.env.NODE_ENV !== 'production') {
      await seedDatabase();
    }
    
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: Connected`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();