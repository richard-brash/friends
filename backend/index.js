import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.js';
import friendsRouter from './routes/friends.js';
import locationsRouter from './routes/locations.js';
import routesRouter from './routes/routes.js';
import runsRouter from './routes/runs.js';
import requestsRouter from './routes/requests.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/routes', routesRouter);
app.use('/api/runs', runsRouter);
app.use('/api/requests', requestsRouter);

app.get('/', (req, res) => {
  res.send('Friends Outreach CRM backend is running.');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
