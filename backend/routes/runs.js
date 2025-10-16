import express from 'express';
import runService from '../services/runService.js';
import { authenticateToken, authorizeRoles } from '../src/middleware/auth.js';

const router = express.Router();

// Get all runs
router.get('/', authenticateToken, async (req, res) => {
	try {
		const runs = await runService.getAllRuns();
		res.json({ runs });
	} catch (error) {
		console.error('Error fetching runs:', error);
		res.status(500).json({ error: 'Failed to fetch runs' });
	}
});

// Get a specific run by ID
router.get('/:id', (req, res) => {
  const run = runs.find(r => r.id === req.params.id);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json({ run });
});

// Create a new run
router.post('/', authenticateToken, authorizeRoles('admin', 'coordinator'), (req, res) => {
  const run = {
    id: Date.now().toString(),
    status: 'scheduled',
    currentLocationIndex: 0,
    actualDuration: null,
    leadNotes: null,
    contactsMade: null,
    completedAt: null,
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

// Assign users to a run
router.post('/:id/assign', (req, res) => {
  const { userIds } = req.body;
  const index = runs.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Run not found' });
  
  runs[index].assignedUserIds = [...new Set([...runs[index].assignedUserIds, ...userIds])];
  res.json(runs[index]);
});

// Remove users from a run  
router.post('/:id/unassign', (req, res) => {
  const { userIds } = req.body;
  const index = runs.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Run not found' });
  
  runs[index].assignedUserIds = runs[index].assignedUserIds.filter(id => !userIds.includes(id));
  res.json(runs[index]);
});

// Update run status and progress
router.patch('/:id/status', (req, res) => {
  const { status, currentLocationIndex, leadNotes, contactsMade } = req.body;
  const index = runs.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Run not found' });
  
  const updates = { status };
  if (currentLocationIndex !== undefined) updates.currentLocationIndex = currentLocationIndex;
  if (leadNotes !== undefined) updates.leadNotes = leadNotes;
  if (contactsMade !== undefined) updates.contactsMade = contactsMade;
  
  if (status === 'completed') {
    updates.completedAt = new Date().toISOString();
  }
  
  runs[index] = { ...runs[index], ...updates };
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
