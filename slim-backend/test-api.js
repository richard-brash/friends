// Quick Backend Test
// Test auth and friends endpoints

const BASE_URL = 'http://localhost:3000/api';

async function test() {
  console.log('🧪 Testing Friends Outreach V2 API\n');

  try {
    // 1. Login with seed data user
    console.log('1️⃣  Testing login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@friendsoutreach.org',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    
    if (!loginData.token) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    console.log(`✅ Login successful! User: ${loginData.user.name}`);
    const token = loginData.token;

    // 2. Get current user
    console.log('\n2️⃣  Testing /auth/me...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    console.log(`✅ Got user: ${meData.user.name} (${meData.user.email})`);

    // 3. Get all friends
    console.log('\n3️⃣  Testing GET /friends...');
    const friendsRes = await fetch(`${BASE_URL}/friends`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const friendsData = await friendsRes.json();
    console.log(`✅ Got ${friendsData.data.length} friends`);
    console.log(`   First 3: ${friendsData.data.slice(0, 3).map(f => f.displayName).join(', ')}`);

    // 4. Get single friend with details
    if (friendsData.data.length > 0) {
      const friendId = friendsData.data[0].id;
      console.log(`\n4️⃣  Testing GET /friends/${friendId}...`);
      const friendRes = await fetch(`${BASE_URL}/friends/${friendId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const friendData = await friendRes.json();
      console.log(`✅ Got friend: ${friendData.displayName}`);
      console.log(`   Location history: ${friendData.locationHistory.length} sightings`);
      if (friendData.locationHistory.length > 0) {
        const last = friendData.locationHistory[0];
        console.log(`   Last seen: ${last.locationName} (${last.routeName})`);
      }
    }

    // 5. Create a new friend
    console.log('\n5️⃣  Testing POST /friends...');
    const createRes = await fetch(`${BASE_URL}/friends`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Friend',
        alias: 'Testy',
        notes: 'Created by API test'
      })
    });
    const createData = await createRes.json();
    console.log(`✅ Created friend: ${createData.displayName} (ID: ${createData.id})`);

    // 6. Update the friend
    console.log('\n6️⃣  Testing PUT /friends...');
    const updateRes = await fetch(`${BASE_URL}/friends/${createData.id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notes: 'Updated by API test'
      })
    });
    const updateData = await updateRes.json();
    console.log(`✅ Updated friend: ${updateData.displayName}`);

    // 7. Search friends
    console.log('\n7️⃣  Testing search...');
    const searchRes = await fetch(`${BASE_URL}/friends?search=john`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const searchData = await searchRes.json();
    console.log(`✅ Search 'john' found ${searchData.data.length} results`);

    // 8. Soft delete the test friend
    console.log('\n8️⃣  Testing DELETE /friends...');
    const deleteRes = await fetch(`${BASE_URL}/friends/${createData.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const deleteData = await deleteRes.json();
    console.log(`✅ Soft deleted friend: ${deleteData.message}`);

    console.log('\n✅ All tests passed! 🎉\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

test();
