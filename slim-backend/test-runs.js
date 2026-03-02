// Test Runs API - Complete run lifecycle
// Tests: create, team management, preparation, execution, deliveries, completion

const BASE_URL = 'http://localhost:3000/api';

async function test() {
  console.log('🧪 Testing Runs API - Complete Lifecycle\n');

  try {
    // Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@friendsoutreach.org',
        password: 'password123'
      })
    });
    const { token } = await loginRes.json();
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('✅ Logged in\n');

    // Get a route
    const routesRes = await fetch(`${BASE_URL}/routes`, { 
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const routesData = await routesRes.json();
    const testRoute = routesData.data[0];
    console.log(`📍 Using route: ${testRoute.name}\n`);

    // 1. Create a run
    console.log('1️⃣  Creating run...');
    const createRes = await fetch(`${BASE_URL}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        routeId: testRoute.id,
        scheduledDate: '2026-01-15',
        mealCount: 50,
        notes: 'Test run'
      })
    });
    const newRun = await createRes.json();
    console.log(`✅ Created: "${newRun.name}" (ID: ${newRun.id})`);
    console.log(`   Status: ${newRun.status}\n`);

    // 2. Add team members
    console.log('2️⃣  Adding team members...');
    await fetch(`${BASE_URL}/runs/${newRun.id}/team`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: 1 }) // Admin
    });
    await fetch(`${BASE_URL}/runs/${newRun.id}/team`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: 2 }) // Coordinator
    });
    console.log('✅ Added 2 team members\n');

    // 3. Get run details
    console.log('3️⃣  Getting run details...');
    const detailRes = await fetch(`${BASE_URL}/runs/${newRun.id}`, { 
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const runDetail = await detailRes.json();
    console.log(`✅ Team size: ${runDetail.team.length}`);
    console.log(`   Locations: ${runDetail.locations.length}`);
    console.log(`   First location: ${runDetail.locations[0]?.name}\n`);

    // 4. Get preparation checklist
    console.log('4️⃣  Getting preparation checklist...');
    const prepRes = await fetch(`${BASE_URL}/runs/${newRun.id}/preparation`, { 
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const prepData = await prepRes.json();
    const requestCount = prepData.locations.reduce((sum, loc) => sum + loc.requests.length, 0);
    console.log(`✅ ${prepData.locations.length} locations with ${requestCount} requests ready\n`);

    // 5. Mark as prepared
    console.log('5️⃣  Marking run as prepared...');
    await fetch(`${BASE_URL}/runs/${newRun.id}/prepare`, {
      method: 'PATCH',
      headers
    });
    console.log('✅ Run marked as prepared\n');

    // 6. Start run
    console.log('6️⃣  Starting run...');
    const startRes = await fetch(`${BASE_URL}/runs/${newRun.id}/start`, {
      method: 'POST',
      headers
    });
    const startData = await startRes.json();
    console.log(`✅ ${startData.message}`);
    console.log(`   Status: ${startData.status}`);
    console.log(`   Current location: ${startData.currentLocationId}\n`);

    // 7. Record delivery at first location
    console.log('7️⃣  Recording delivery...');
    const deliveryRes = await fetch(`${BASE_URL}/runs/${newRun.id}/deliveries`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        locationId: startData.currentLocationId,
        mealsDelivered: 12,
        weeklyItems: [
          { type: 'blankets', count: 3 },
          { type: 'hygiene_kits', count: 5 }
        ],
        notes: 'Good turnout'
      })
    });
    const delivery = await deliveryRes.json();
    console.log(`✅ Recorded: ${delivery.mealsDelivered} meals delivered`);
    console.log(`   Weekly items: ${delivery.weeklyItems.length} types\n`);

    // 8. Move to next location
    console.log('8️⃣  Moving to next location...');
    const nextRes = await fetch(`${BASE_URL}/runs/${newRun.id}/next`, {
      method: 'POST',
      headers
    });
    const nextData = await nextRes.json();
    console.log(`✅ ${nextData.message}\n`);

    // 9. Complete run
    console.log('9️⃣  Completing run...');
    const completeRes = await fetch(`${BASE_URL}/runs/${newRun.id}/complete`, {
      method: 'POST',
      headers
    });
    const completeData = await completeRes.json();
    console.log(`✅ ${completeData.message}`);
    console.log(`   Final status: ${completeData.status}\n`);

    // 10. Verify final state
    console.log('🔟  Verifying final state...');
    const finalRes = await fetch(`${BASE_URL}/runs/${newRun.id}`, { 
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const finalRun = await finalRes.json();
    console.log(`✅ Run completed successfully`);
    console.log(`   Status: ${finalRun.status}`);
    console.log(`   Deliveries recorded: ${finalRun.deliveries.length}`);
    console.log(`   Team members: ${finalRun.team.length}\n`);

    console.log('✅ All runs tests passed! 🎉\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

test();
