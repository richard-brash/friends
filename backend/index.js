import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Database imports
import { testConnection, initializeSchema } from './database.js';
import { resetAndSeed, seedDatabase, seedSampleData } from './seed.js';

// Route imports
import authRouter from './src/routes/auth.js';
import usersRouter from './routes/users.js';
import friendsRouter from './routes/friends.js';
import locationsRouter from './routes/locations.js';
import routesRouter from './routes/routes.js';
import runsRouter from './routes/runs.js';
import requestsRouter from './routes/requests.js';
import { 
  sampleUsers, 
  sampleLocations, 
  sampleRoutes, 
  sampleFriends, 
  sampleRuns, 
  sampleRequests,
  sampleDeliveryAttempts 
} from './cleanSampleData.js';
import { users } from './routes/users.js';
import { runs } from './routes/runs.js';
import { requests, deliveryAttempts } from './routes/requests.js';
import { seedFriends, clearAllFriends } from './models/friend.js';
import { seedLocations, clearAllLocations } from './models/location.js';
import { seedRoutes, clearAllRoutes } from './models/route.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
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

// Database management endpoints
app.post('/api/seed', async (req, res) => {
  try {
    console.log('🌱 Seeding sample data via API...');
    await seedSampleData();
    
    res.json({ 
      message: 'Sample data seeded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    
    // Fallback to in-memory seeding if database fails
    try {
      console.log('⚠️  Database seeding failed, falling back to in-memory...');
      // Clear existing data first
      users.length = 0;
      runs.length = 0;
      requests.length = 0;
      deliveryAttempts.length = 0;
      clearAllFriends();
      clearAllLocations();
      clearAllRoutes();
      
      // Seed data in the correct order
      seedLocations(sampleLocations);
      seedRoutes(sampleRoutes);
      seedFriends(sampleFriends);
      users.push(...sampleUsers);
      runs.push(...sampleRuns);
      requests.push(...sampleRequests);
      deliveryAttempts.push(...sampleDeliveryAttempts);
      
      res.json({ 
        message: 'Sample data loaded successfully (in-memory fallback)',
        data: {
          users: sampleUsers.length,
          friends: sampleFriends.length,
          locations: sampleLocations.length,
          routes: sampleRoutes.length,
          runs: sampleRuns.length,
          requests: sampleRequests.length,
          deliveryAttempts: sampleDeliveryAttempts.length
        }
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Failed to load sample data', 
        details: `Database: ${error.message}, Fallback: ${fallbackError.message}` 
      });
    }
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
      console.log('🔧 Initializing database schema...');
      await initializeSchema();
      
      // Only seed in development, not production
      if (process.env.NODE_ENV !== 'production') {
        console.log('🌱 Seeding database with sample data...');
        await seedDatabase();
      }
    } else {
      console.log('⚠️  Database connection failed - falling back to in-memory storage');
      console.log('Loading initial sample data (in-memory)...');
      
      // Clear existing data first
      users.length = 0;
      runs.length = 0;
      requests.length = 0;
      deliveryAttempts.length = 0;
      clearAllFriends();
      clearAllLocations();
      clearAllRoutes();
      
      // Seed data in the correct order
      seedLocations(sampleLocations);
      seedRoutes(sampleRoutes);
      seedFriends(sampleFriends);
      users.push(...sampleUsers);
      runs.push(...sampleRuns);
      requests.push(...sampleRequests);
      deliveryAttempts.push(...sampleDeliveryAttempts);
      
      console.log(`Sample data loaded: ${sampleUsers.length} users, ${sampleFriends.length} friends, ${sampleLocations.length} locations, ${sampleRoutes.length} routes, ${sampleRuns.length} runs, ${sampleRequests.length} requests`);
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
