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
