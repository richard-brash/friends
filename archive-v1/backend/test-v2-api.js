// Test V2 Friends API through HTTP
import jwt from 'jsonwebtoken';

async function testV2FriendsAPI() {
  try {
    // Create a test token
    const token = jwt.sign(
      { userId: 1, email: 'admin@friendsoutreach.org', role: 'admin' }, 
      'your-secret-key',
      { expiresIn: '1h' }
    );

    const response = await fetch('http://localhost:4000/api/v2/friends', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ V2 Friends API Response:');
    console.log(`Found ${data.count} friends`);
    if (data.data && data.data.length > 0) {
      console.log('\nSample friend:');
      const friend = data.data[0];
      console.log(`- Name: ${friend.name}`);
      console.log(`- Current Location: ${friend.locationName || 'None'}`);
      console.log(`- Location History Count: ${friend.locationHistoryCount || 0}`);
      console.log(`- Most Recent Date: ${friend.mostRecentLocationDate || 'None'}`);
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
}

testV2FriendsAPI();