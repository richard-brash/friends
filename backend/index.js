import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Database imports
import { testConnection, initializeSchema, query, pool } from './database.js';
import { resetAndSeed, seedDatabase, seedSampleData } from './seed.js';

// Route imports
import authRouter from './src/routes/auth.js';
import usersRouter from './routes/users.js';
// import friendsRouter from './routes/friends.js'; // DISABLED - V1 friends broken due to removed current_location_id
// import locationsRouter from './routes/locations.js'; // DISABLED - V1 locations broken due to removed current_location_id  
// import routesRouter from './routes/routes.js'; // DISABLED - V1 routes broken due to removed current_location_id
// import requestsRouter from './routes/requests.js'; // DISABLED - V1 requests may be broken

// V2 Routes (Clean Architecture)
import runsV2Router from './routes/v2/runs.js';
import friendsV2Router from './routes/v2/friends.js';
import locationsV2Router from './routes/v2/locations.js';
import routesV2Router from './routes/v2/routes.js';
import requestsV2Router from './routes/v2/requests.js';
import executionRouter from './routes/v2/execution.js';

// Middleware imports
import errorHandler from './middleware/errorHandler.js';
import { 
  sampleUsers, 
  sampleLocations, 
  sampleRoutes, 
  sampleFriends, 
  sampleRuns, 
  sampleRequests,
  sampleDeliveryAttempts 
} from './cleanSampleData.js';
// Database services will handle data persistence

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Make database pool available to routes
app.locals.db = pool;

// Health check endpoint (no auth required)
app.get('/api/health', async (req, res) => {
  try {
    // Check database counts
    const userCount = await query('SELECT COUNT(*) FROM users');
    const runCount = await query('SELECT COUNT(*) FROM runs');
    const requestCount = await query('SELECT COUNT(*) FROM requests');
    const friendCount = await query('SELECT COUNT(*) FROM friends');
    const locationCount = await query('SELECT COUNT(*) FROM locations');
    const routeCount = await query('SELECT COUNT(*) FROM routes');

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      data_counts: {
        users: parseInt(userCount.rows[0].count),
        runs: parseInt(runCount.rows[0].count),
        requests: parseInt(requestCount.rows[0].count),
        friends: parseInt(friendCount.rows[0].count),
        locations: parseInt(locationCount.rows[0].count),
        routes: parseInt(routeCount.rows[0].count)
      }
    });
  } catch (error) {
    res.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
// app.use('/api/friends', friendsRouter); // DISABLED - V1 friends broken, use V2
// app.use('/api/locations', locationsRouter); // DISABLED - V1 locations broken
// app.use('/api/routes', routesRouter); // DISABLED - V1 routes broken  
// app.use('/api/requests', requestsRouter); // DISABLED - V1 requests may be broken

// V2 API routes (Clean Architecture) - migrated from V1
app.use('/api/runs', runsV2Router); // Now using V2 as the main endpoint
app.use('/api/v2/runs', runsV2Router); // Keep V2 endpoint for backward compatibility
app.use('/api/v2/friends', friendsV2Router); // New V2 friends API
app.use('/api/v2/locations', locationsV2Router); // New V2 locations API
app.use('/api/v2/routes', routesV2Router); // New V2 routes API
app.use('/api/v2/requests', requestsV2Router); // New V2 requests API
app.use('/api/v2/execution', executionRouter); // Run execution (field operations)

// Database management endpoints
app.post('/api/seed', async (req, res) => {
  try {
    console.log('🌱 Seeding sample data via API...');
    await seedSampleData();
    
    res.json({ 
      message: 'Sample data seeded successfully to database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    res.status(500).json({ 
      error: 'Failed to seed sample data to database', 
      details: error.message 
    });
  }
});

// Reset database (full wipe and reseed)
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

// Serve static files from frontend dist
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    
    if (connected) {
      console.log('✅ Database connected successfully');
      // Database schema and seeding should be done manually via:
      // node populate-database.js
      // NOT automatically on every server start!
    } else {
      console.error('❌ Database connection failed - server cannot start without database');
      process.exit(1);
    }
    
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${connected ? 'Connected (PostgreSQL)' : 'In-Memory Arrays'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

// Add manual database reset functionality
process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    const input = chunk.trim().toLowerCase();
    if (input === 'reset' || input === 'r') {
      console.log('🔄 Manual database reset triggered...');
      resetAndSeed()
        .then(() => {
          console.log('✅ Database reset completed successfully!');
          console.log('💡 You can now login with admin@friendsoutreach.org / password');
        })
        .catch((error) => {
          console.error('❌ Manual reset failed:', error.message);
        });
    } else if (input === 'help' || input === 'h') {
      console.log('📖 Available commands:');
      console.log('  reset, r  - Reset and reseed database');
      console.log('  help, h   - Show this help');
      console.log('  quit, q   - Exit server');
    } else if (input === 'quit' || input === 'q') {
      console.log('👋 Shutting down server...');
      process.exit(0);
    }
  }
});

console.log('💡 Type "reset" or "r" to manually reset the database');
console.log('💡 Type "help" or "h" for available commands');
