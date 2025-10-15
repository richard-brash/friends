// Test login directly
async function testLogin() {
  try {
    console.log('🧪 Testing login...');
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@friends.org',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User:', data.user);
      console.log('Token received:', !!data.token);
    } else {
      console.error('❌ Login failed:');
      console.error('Status:', response.status);
      console.error('Error:', data);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testLogin();