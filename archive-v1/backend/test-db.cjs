// Test database setup and seeding
require('dotenv').config();
const { testConnection, initializeSchema } = require('./database');
const { resetAndSeed } = require('./seed');

async function test() {
  console.log('🧪 Testing database setup...\n');
  
  try {
    // Test connection
    console.log('1. Testing connection...');
    const connected = await testConnection();
    if (!connected) {
      console.log('❌ Connection failed - this is expected if you haven\'t set up PostgreSQL yet');
      console.log('📝 Next steps:');
      console.log('   1. Add PostgreSQL service to Railway project');
      console.log('   2. Copy DATABASE_URL from Railway to .env file');
      console.log('   3. Run this test again');
      return;
    }
    
    // Initialize schema
    console.log('\n2. Initializing schema...');
    await initializeSchema();
    
    // Seed database
    console.log('\n3. Seeding database...');
    await resetAndSeed();
    
    console.log('\n✅ Database setup complete!');
    console.log('🚀 Ready to start the server with: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n📝 Troubleshooting:');
    console.log('   - Check DATABASE_URL in .env file');
    console.log('   - Ensure PostgreSQL service is running');
    console.log('   - Verify network connectivity');
  }
  
  process.exit(0);
}

test();