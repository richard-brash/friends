// V2 Requests API routes
import express from 'express';
import RequestRepository from '../../repositories/requestRepository.js';
import CleanRequestService from '../../services/cleanRequestService.js';
import { authenticateToken } from '../../src/middleware/auth.js';

const router = express.Router();
const requestService = new CleanRequestService(new RequestRepository());

// POST /api/v2/requests/:id/status-history
router.post('/:id/status-history', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Status history request - req.user:', req.user);
    console.log('📝 Status history request - req.body:', req.body);
    
    // Automatically add user_id from authenticated user
    const statusData = {
      ...req.body,
      user_id: req.user?.id
    };
    
    console.log('📝 statusData being sent to service:', statusData);
    
    if (!statusData.user_id) {
      console.error('❌ ERROR: user_id is missing! req.user:', req.user);
      return res.status(400).json({ error: 'User authentication failed - no user ID available' });
    }
    
    const historyEntry = await requestService.addStatusHistory(req.params.id, statusData);
    res.status(201).json({ statusHistory: historyEntry });
  } catch (err) {
    console.error('❌ Error in status-history endpoint:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/v2/requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const includeStatusHistory = req.query.include === 'statusHistory';
    const requests = await requestService.getAll({ includeStatusHistory });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v2/requests/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const includeStatusHistory = req.query.include === 'statusHistory';
    const request = await requestService.getById(req.params.id, { includeStatusHistory });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v2/requests
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newRequest = await requestService.create(req.body);
    res.status(201).json({ request: newRequest });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/v2/requests/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await requestService.update(req.params.id, req.body);
    res.json({ request: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/v2/requests/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await requestService.delete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/v2/requests/:id/status-history
router.get('/:id/status-history', authenticateToken, async (req, res) => {
  try {
    const history = await requestService.getStatusHistory(req.params.id);
    res.json({ statusHistory: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v2/requests/:id/delivery-attempts (for backward compatibility, returns only delivery attempts)
router.get('/:id/delivery-attempts', authenticateToken, async (req, res) => {
  try {
    const attempts = await requestService.getDeliveryAttempts(req.params.id);
    res.json({ deliveryAttempts: attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
