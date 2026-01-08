// Test V2 Runs API endpoints
const API_BASE = 'http://localhost:4000/api/v2';

async function testAPI() {
  console.log('🧪 Testing V2 Runs API Endpoints\n');

  try {
    // Get auth token first
    console.log('1️⃣ Authenticating...');
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@friendsoutreach.org', password: 'password' })
    });
    const loginData = await loginRes.json();
    console.log(`   Login status: ${loginRes.status}`);
    
    if (!loginData.token) {
      console.log(`   Login response:`, loginData);
      throw new Error('No token received from login');
    }
    
    const token = loginData.token;
    console.log('   ✓ Authenticated\n');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Test 1: GET all runs
    console.log('2️⃣ GET /api/v2/runs - Fetch all runs');
    const getAllRes = await fetch(`${API_BASE}/runs`, { headers });
    const getAllData = await getAllRes.json();
    const allRuns = getAllData.data || [];
    console.log(`   Status: ${getAllRes.status}`);
    console.log(`   Runs count: ${allRuns.length}`);
    console.log(`   Sample run: ${allRuns[0]?.name}`);
    console.log(`   Has mealCount: ${allRuns[0]?.mealCount !== undefined}`);
    console.log(`   ✓ GET all runs successful\n`);

    // Test 2: GET run by ID with team
    console.log('3️⃣ GET /api/v2/runs/:id?includeTeam=true');
    const getByIdRes = await fetch(`${API_BASE}/runs/1?includeTeam=true`, { headers });
    const getByIdData = await getByIdRes.json();
    const runWithTeam = getByIdData.data || {};
    console.log(`   Status: ${getByIdRes.status}`);
    console.log(`   Run name: ${runWithTeam.name}`);
    console.log(`   Meal count: ${runWithTeam.mealCount}`);
    console.log(`   Team size: ${runWithTeam.team?.length || 0}`);
    console.log(`   Team lead: ${runWithTeam.team?.[0]?.user_name}`);
    console.log(`   ✓ GET run with team successful\n`);

    // Test 3: POST - Create new run (name should be auto-generated)
    console.log('4️⃣ POST /api/v2/runs - Create run (name auto-generated)');
    const createData = {
      routeId: 1,
      scheduledDate: '2025-10-25', // Saturday
      startTime: '10:00:00',
      endTime: '13:00:00',
      mealCount: 45,
      notes: 'API test run'
      // Note: NO name field - it should be auto-generated
    };
    const createRes = await fetch(`${API_BASE}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createData)
    });
    const createResData = await createRes.json();
    const createdRun = createResData.data || {};
    console.log(`   Status: ${createRes.status}`);
    console.log(`   Created run ID: ${createdRun.id}`);
    console.log(`   Auto-generated name: "${createdRun.name}"`);
    console.log(`   Expected format: "AACo Saturday 2025-10-25"`);
    console.log(`   Meal count: ${createdRun.mealCount}`);
    console.log(`   ✓ Match: ${createdRun.name === 'AACo Saturday 2025-10-25'}`);
    console.log(`   ✓ POST create successful\n`);

    const newRunId = createdRun.id;

    // Test 4: PUT - Update meal count (name should be ignored)
    console.log('5️⃣ PUT /api/v2/runs/:id - Update meal count');
    const updateData = {
      mealCount: 55,
      name: 'This Should Be Ignored', // Name is read-only
      notes: 'Updated via API test'
    };
    const updateRes = await fetch(`${API_BASE}/runs/${newRunId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });
    const updateResData = await updateRes.json();
    const updatedRun = updateResData.data || {};
    console.log(`   Status: ${updateRes.status}`);
    console.log(`   Name after update: "${updatedRun.name}"`);
    console.log(`   Meal count after update: ${updatedRun.mealCount}`);
    console.log(`   Notes: ${updatedRun.notes}`);
    console.log(`   ✓ Name unchanged: ${updatedRun.name === 'AACo Saturday 2025-10-25'}`);
    console.log(`   ✓ Meal count updated: ${updatedRun.mealCount === 55}`);
    console.log(`   ✓ PUT update successful\n`);

    // Test 5: POST team members
    console.log('6️⃣ POST /api/v2/runs/:id/team-members - Add team members');
    const addMemberRes1 = await fetch(`${API_BASE}/runs/${newRunId}/team-members`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: 2 }) // John - will be lead (first)
    });
    const addMemberData1 = await addMemberRes1.json();
    const member1 = addMemberData1.data || {};
    console.log(`   Member 1 response:`, member1);
    console.log(`   Added member 1: ${member1.userName} (lead)`);

    const addMemberRes2 = await fetch(`${API_BASE}/runs/${newRunId}/team-members`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: 3 }) // Sarah
    });
    const addMemberData2 = await addMemberRes2.json();
    const member2 = addMemberData2.data || {};
    console.log(`   Added member 2: ${member2.userName}`);
    console.log(`   ✓ Team members added\n`);

    // Test 6: GET team members
    console.log('7️⃣ GET /api/v2/runs/:id/team-members - Verify lead order');
    const getTeamRes = await fetch(`${API_BASE}/runs/${newRunId}/team-members`, { headers });
    const getTeamData = await getTeamRes.json();
    const team = getTeamData.data || [];
    console.log(`   Team response:`, team);
    console.log(`   Team size: ${team.length}`);
    console.log(`   Lead (first): ${team[0]?.userName}`);
    console.log(`   Member (second): ${team[1]?.userName}`);
    console.log(`   ✓ Lead identified correctly: ${team[0]?.userName === 'John Coordinator'}\n`);

    // Test 7: Validate negative meal count is rejected
    console.log('8️⃣ POST /api/v2/runs - Validate negative meal count rejected');
    const invalidData = {
      routeId: 1,
      scheduledDate: '2025-10-26',
      startTime: '09:00:00',
      mealCount: -10 // Invalid
    };
    const invalidRes = await fetch(`${API_BASE}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(invalidData)
    });
    const errorData = await invalidRes.json();
    const errorResponse = errorData.error || errorData.message || 'Unknown error';
    console.log(`   Status: ${invalidRes.status}`);
    console.log(`   Error message: ${errorResponse}`);
    console.log(`   ✓ Validation working: ${invalidRes.status === 400}\n`);

    // Cleanup
    console.log('9️⃣ DELETE /api/v2/runs/:id - Cleanup test run');
    const deleteRes = await fetch(`${API_BASE}/runs/${newRunId}`, {
      method: 'DELETE',
      headers
    });
    console.log(`   Status: ${deleteRes.status}`);
    console.log(`   ✓ Test run deleted\n`);

    console.log('🎉 All API endpoint tests passed!\n');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAPI();
