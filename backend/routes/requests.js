import express from 'express';
import { authenticateToken, authorizeRoles } from '../src/middleware/auth.js';
import requestService from '../services/requestService.js';
const router = express.Router();

// Get all requests with optional filtering (Authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let requests;
    
    // Filter by status
    if (req.query.status) {
      requests = await requestService.getRequestsByStatus(req.query.status);
    }
    // Filter by friend ID
    else if (req.query.friendId) {
      requests = await requestService.getRequestsByFriendId(req.query.friendId);
    }
    // Filter by run ID
    else if (req.query.runId) {
      requests = await requestService.getRequestsByRunId(req.query.runId);
    }
    // Get all requests
    else {
      requests = await requestService.getAllRequests();
    }
    
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get a single request by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const request = await requestService.getRequestById(Number(req.params.id));
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ request });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// Create a new request - volunteers can create during runs
router.post('/', authenticateToken, authorizeRoles('admin', 'coordinator', 'volunteer'), async (req, res) => {
  try {
    const request = await requestService.createRequest({
      friend_id: req.body.friendId,
      category: req.body.category || 'general',
      item_name: req.body.itemRequested,
      description: req.body.specialInstructions || '',
      quantity: req.body.quantity || 1,
      priority: req.body.urgency || 'medium',
      notes: req.body.notes || ''
    });
    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Update a request
router.put('/:id', authenticateToken, (req, res) => {
  const index = requests.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Request not found' });
  
  requests[index] = { 
    ...requests[index], 
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(requests[index]);
});

// Delete a request
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'coordinator'), (req, res) => {
  const index = requests.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Request not found' });
  
  // Also delete associated delivery attempts
  const requestId = requests[index].id;
  for (let i = deliveryAttempts.length - 1; i >= 0; i--) {
    if (deliveryAttempts[i].requestId === requestId) {
      deliveryAttempts.splice(i, 1);
    }
  }
  
  requests.splice(index, 1);
  res.json({ message: 'Request and associated delivery attempts deleted' });
});

// Bulk operations
router.post('/bulk', (req, res) => {
  const { operation, requestIds, updates } = req.body;
  
  if (operation === 'updateStatus') {
    const updatedRequests = [];
    requestIds.forEach(id => {
      const index = requests.findIndex(r => r.id === id);
      if (index !== -1) {
        requests[index].status = updates.status;
        requests[index].updatedAt = new Date().toISOString();
        updatedRequests.push(requests[index]);
      }
    });
    return res.json({ updated: updatedRequests.length, requests: updatedRequests });
  }
  
  res.status(400).json({ error: 'Invalid bulk operation' });
});

// ===== DELIVERY ATTEMPTS ROUTES =====

// Get delivery attempts for a request
router.get('/:requestId/delivery-attempts', authenticateToken, (req, res) => {
  const attempts = deliveryAttempts.filter(da => da.requestId === req.params.requestId);
  res.json({ deliveryAttempts: attempts });
});

// Create a delivery attempt
router.post('/:requestId/delivery-attempts', authenticateToken, (req, res) => {
  const request = requests.find(r => r.id === req.params.requestId);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  
  const attempt = {
    id: Date.now().toString(),
    requestId: req.params.requestId,
    attemptDate: req.body.attemptDate || new Date().toISOString().split('T')[0],
    outcome: req.body.outcome, // 'delivered', 'not_home', 'refused', 'other'
    notes: req.body.notes || '',
    deliveredBy: req.body.deliveredBy || '',
    createdAt: new Date().toISOString()
  };
  
  deliveryAttempts.push(attempt);
  
  // Update request status based on outcome
  if (attempt.outcome === 'delivered') {
    const requestIndex = requests.findIndex(r => r.id === req.params.requestId);
    if (requestIndex !== -1) {
      requests[requestIndex].status = 'delivered';
      requests[requestIndex].updatedAt = new Date().toISOString();
    }
  }
  
  res.status(201).json(attempt);
});

// Update a delivery attempt
router.put('/:requestId/delivery-attempts/:attemptId', (req, res) => {
  const index = deliveryAttempts.findIndex(da => 
    da.id === req.params.attemptId && da.requestId === req.params.requestId
  );
  
  if (index === -1) return res.status(404).json({ error: 'Delivery attempt not found' });
  
  deliveryAttempts[index] = { 
    ...deliveryAttempts[index], 
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(deliveryAttempts[index]);
});

// Delete a delivery attempt
router.delete('/:requestId/delivery-attempts/:attemptId', (req, res) => {
  const index = deliveryAttempts.findIndex(da => 
    da.id === req.params.attemptId && da.requestId === req.params.requestId
  );
  
  if (index === -1) return res.status(404).json({ error: 'Delivery attempt not found' });
  
  deliveryAttempts.splice(index, 1);
  res.json({ message: 'Delivery attempt deleted' });
});

// ===== SEED AND UTILITY ROUTES =====

// Seed requests (for sample data)
router.post('/seed', (req, res) => {
  const { requests: seedRequests, deliveryAttempts: seedAttempts } = req.body;
  
  if (seedRequests) {
    requests.push(...seedRequests);
  }
  
  if (seedAttempts) {
    deliveryAttempts.push(...seedAttempts);
  }
  
  res.json({ 
    message: `${seedRequests?.length || 0} requests and ${seedAttempts?.length || 0} delivery attempts seeded` 
  });
});

// Clear all requests and delivery attempts
router.delete('/all', (req, res) => {
  requests.length = 0;
  deliveryAttempts.length = 0;
  res.json({ message: 'All requests and delivery attempts cleared' });
});

// Get requests ready for delivery (status: ready_for_delivery)
router.get('/ready-for-delivery', (req, res) => {
  const readyRequests = requests.filter(r => r.status === 'ready_for_delivery');
  
  // Group by location if requested
  if (req.query.groupBy === 'location') {
    const grouped = readyRequests.reduce((acc, request) => {
      const locationId = request.locationId;
      if (!acc[locationId]) acc[locationId] = [];
      acc[locationId].push(request);
      return acc;
    }, {});
    
    return res.json({ requestsByLocation: grouped });
  }
  
  res.json({ requests: readyRequests });
});

export default router;
