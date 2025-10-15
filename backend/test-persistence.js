import { query } from './database.js';

async function testPersistence() {
  try {
    console.log('🔍 Checking current routes...');
    const existing = await query('SELECT * FROM routes ORDER BY id');
    console.log(`Found ${existing.rows.length} existing routes`);
    
    if (existing.rows.length > 0) {
      console.log('Existing routes:');
      existing.rows.forEach(route => {
        console.log(`- ID ${route.id}: ${route.name} (${route.description})`);
      });
    }
    
    console.log('\n🏗️  Creating a new test route...');
    const result = await query(
      'INSERT INTO routes (name, description, color) VALUES ($1, $2, $3) RETURNING *',
      ['Test Persistence Route', 'This route tests that database changes persist across deployments', '#ff5722']
    );
    
    console.log('✅ Created route:', result.rows[0]);
    console.log('\n📝 This route should persist even after you push updates to Railway!');
    console.log('Try pushing an update and then check - the route will still be there.');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  process.exit(0);
}

testPersistence();