import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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
  sampleRequests 
} from './sampleData.js';
import { users } from './routes/users.js';
import { runs } from './routes/runs.js';
import { requests } from './routes/requests.js';
import { seedFriends, clearAllFriends } from './models/friend.js';
import { seedLocations, clearAllLocations } from './models/location.js';
import { seedRoutes, clearAllRoutes } from './models/route.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/users', usersRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/routes', routesRouter);
app.use('/api/runs', runsRouter);
app.use('/api/requests', requestsRouter);

// Sample data endpoints
app.post('/api/seed', (req, res) => {
  try {
    // Clear existing data first
    users.length = 0;
    runs.length = 0;
    requests.length = 0;
    clearAllFriends();
    clearAllLocations();
    clearAllRoutes();
    
    // Seed data in the correct order (locations first, then routes, then friends)
    seedLocations(sampleLocations);
    seedRoutes(sampleRoutes);
    seedFriends(sampleFriends);
    users.push(...sampleUsers);
    runs.push(...sampleRuns);
    requests.push(...sampleRequests);
    
    res.json({ 
      message: 'Sample data loaded successfully',
      data: {
        users: sampleUsers.length,
        friends: sampleFriends.length,
        locations: sampleLocations.length,
        routes: sampleRoutes.length,
        runs: sampleRuns.length,
        requests: sampleRequests.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load sample data', details: error.message });
  }
});

app.delete('/api/seed', (req, res) => {
  try {
    // Clear all data arrays
    users.length = 0;
    runs.length = 0;
    requests.length = 0;
    clearAllFriends();
    clearAllLocations();
    clearAllRoutes();
    
    res.json({ message: 'All data cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear data', details: error.message });
  }
});

// Serve static files from frontend dist
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
