// Test Routes, Locations, and Requests APIs
// Quick verification test

const BASE_URL = 'http://localhost:3000/api';

async function test() {
  console.log('🧪 Testing Routes, Locations & Requests APIs\n');

  try {
    // Login first
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@friendsoutreach.org',
        password: 'password123'
      })
    });
    const { token } = await loginRes.json();
    console.log('✅ Logged in\n');

    const headers = { 'Authorization': `Bearer ${token}` };

    // Test Routes
    console.log('📍 Testing Routes...');
    const routesRes = await fetch(`${BASE_URL}/routes`, { headers });
    const routesData = await routesRes.json();
    console.log(`✅ Got ${routesData.data.length} routes`);
    routesData.data.forEach(r => {
      console.log(`   - ${r.name}: ${r.locationCount} locations`);
    });

    // Test Locations
    console.log('\n📍 Testing Locations...');
    const firstRoute = routesData.data[0];
    const locationsRes = await fetch(`${BASE_URL}/locations?routeId=${firstRoute.id}`, { headers });
    const locationsData = await locationsRes.json();
    console.log(`✅ Got ${locationsData.data.length} locations for ${firstRoute.name}`);
    console.log(`   First 3: ${locationsData.data.slice(0, 3).map(l => l.name).join(', ')}`);

    // Test Requests
    console.log('\n📍 Testing Requests...');
    const requestsRes = await fetch(`${BASE_URL}/requests?status=pending`, { headers });
    const requestsData = await requestsRes.json();
    console.log(`✅ Got ${requestsData.data.length} pending requests`);
    if (requestsData.data.length > 0) {
      const req = requestsData.data[0];
      console.log(`   Example: ${req.friendName} @ ${req.locationName}`);
      console.log(`   Item: ${req.itemDescription} (${req.priority} priority)`);

      // Test request details with history
      const reqDetailRes = await fetch(`${BASE_URL}/requests/${req.id}`, { headers });
      const reqDetail = await reqDetailRes.json();
      console.log(`   Status history: ${reqDetail.statusHistory.length} entries`);
    }

    // Test creating a request
    console.log('\n📍 Testing Request Creation...');
    const createReqRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        friendId: 1,
        locationId: 1,
        itemDescription: 'Test item - please ignore',
        quantity: 1,
        priority: 'low',
        notes: 'Created by API test'
      })
    });
    const newReq = await createReqRes.json();
    console.log(`✅ Created request ID ${newReq.id}`);

    // Test status update
    console.log('\n📍 Testing Status Update...');
    const statusRes = await fetch(`${BASE_URL}/requests/${newReq.id}/status`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'ready_for_delivery',
        notes: 'Updated by test'
      })
    });
    const statusData = await statusRes.json();
    console.log(`✅ Updated status: ${statusData.status}`);

    // Cancel test request
    console.log('\n📍 Cleaning up test request...');
    await fetch(`${BASE_URL}/requests/${newReq.id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes: 'Test cleanup' })
    });
    console.log(`✅ Cancelled test request\n`);

    console.log('✅ All tests passed! 🎉\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

test();
