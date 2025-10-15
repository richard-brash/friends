// Reset database and test login
async function resetAndTestLogin() {
  try {
    console.log('🔄 Resetting database...');
    
    // Reset database
    const resetResponse = await fetch('http://localhost:4000/api/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const resetData = await resetResponse.json();
    
    if (resetResponse.ok) {
      console.log('✅ Database reset successful:', resetData.message);
      
      // Wait a moment for reset to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now try login
      console.log('🧪 Testing login after reset...');
      const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@friends.org',
          password: 'admin123'
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ Login successful!');
        console.log('User:', loginData.user);
      } else {
        console.error('❌ Login failed:');
        console.error('Status:', loginResponse.status);
        console.error('Error:', loginData);
      }
      
    } else {
      console.error('❌ Database reset failed:', resetData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetAndTestLogin();