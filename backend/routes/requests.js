import express from 'express';
import { authenticateToken, authorizeRoles } from '../src/middleware/auth.js';
const router = express.Router();

// In-memory storage for requests and delivery attempts
export let requests = [];
export let deliveryAttempts = [];

// Get all requests with optional filtering (Authenticated users)
router.get('/', authenticateToken, (req, res) => {
  let filteredRequests = [...requests];
  
  // Filter by status
  if (req.query.status) {
    filteredRequests = filteredRequests.filter(r => r.status === req.query.status);
  }
  
  // Filter by friend ID
  if (req.query.friendId) {
    filteredRequests = filteredRequests.filter(r => r.friendId === req.query.friendId);
  }
  
  // Filter by run ID
  if (req.query.runId) {
    filteredRequests = filteredRequests.filter(r => r.runId === req.query.runId);
  }
  
  // Filter by route ID
  if (req.query.routeId) {
    filteredRequests = filteredRequests.filter(r => r.routeId === req.query.routeId);
  }
  
  // Filter by location ID
  if (req.query.locationId) {
    filteredRequests = filteredRequests.filter(r => r.locationId === req.query.locationId);
  }
  
  // Include delivery attempts if requested
  if (req.query.include === 'deliveryAttempts') {
    filteredRequests = filteredRequests.map(request => ({
      ...request,
      deliveryAttempts: deliveryAttempts.filter(da => da.requestId === request.id)
    }));
  }
  
  res.json({ requests: filteredRequests });
});

// Get a single request by ID
router.get('/:id', authenticateToken, (req, res) => {
  const request = requests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  
  // Include delivery attempts
  const requestWithAttempts = {
    ...request,
    deliveryAttempts: deliveryAttempts.filter(da => da.requestId === request.id)
  };
  
  res.json(requestWithAttempts);
});

// Create a new request - volunteers can create during runs
router.post('/', authenticateToken, authorizeRoles('admin', 'coordinator', 'volunteer'), (req, res) => {
  const request = {
    id: Date.now().toString(),
    friendId: req.body.friendId,
    runId: req.body.runId,
    routeId: req.body.routeId,
    locationId: req.body.locationId,
    itemRequested: req.body.itemRequested,
    quantity: req.body.quantity || 1,
    urgency: req.body.urgency || 'medium',
    specialInstructions: req.body.specialInstructions || '',
    status: req.body.status || 'pending',
    dateRequested: req.body.dateRequested || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  requests.push(request);
  res.status(201).json(request);
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
