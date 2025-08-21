import express from 'express';
const router = express.Router();

// In-memory storage for runs
export let runs = [];

// Get all runs
router.get('/', (req, res) => res.json({ runs }));

// Create a new run
router.post('/', (req, res) => {
  const run = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  runs.push(run);
  res.status(201).json(run);
});

// Update a run
router.put('/:id', (req, res) => {
  const index = runs.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Run not found' });
  
  runs[index] = { ...runs[index], ...req.body };
  res.json(runs[index]);
});

// Delete a run
router.delete('/:id', (req, res) => {
  const index = runs.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Run not found' });
  
  runs.splice(index, 1);
  res.json({ message: 'Run deleted' });
});

// Seed runs (for sample data)
router.post('/seed', (req, res) => {
  runs.push(...req.body);
  res.json({ message: `${req.body.length} runs seeded` });
});

// Clear all runs
router.delete('/all', (req, res) => {
  runs.length = 0;
  res.json({ message: 'All runs cleared' });
});

export default router;
