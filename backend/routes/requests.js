import express from 'express';
const router = express.Router();

// In-memory storage for requests
export let requests = [];

// Get all requests
router.get('/', (req, res) => res.json({ requests }));

// Create a new request
router.post('/', (req, res) => {
  const request = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  requests.push(request);
  res.status(201).json(request);
});

// Update a request
router.put('/:id', (req, res) => {
  const index = requests.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Request not found' });
  
  requests[index] = { ...requests[index], ...req.body };
  res.json(requests[index]);
});

// Delete a request
router.delete('/:id', (req, res) => {
  const index = requests.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Request not found' });
  
  requests.splice(index, 1);
  res.json({ message: 'Request deleted' });
});

// Seed requests (for sample data)
router.post('/seed', (req, res) => {
  requests.push(...req.body);
  res.json({ message: `${req.body.length} requests seeded` });
});

// Clear all requests
router.delete('/all', (req, res) => {
  requests.length = 0;
  res.json({ message: 'All requests cleared' });
});

export default router;
