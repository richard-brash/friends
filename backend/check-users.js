// Quick test to check what users are in the database
import { query } from './database.js';

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    const result = await query('SELECT id, username, email, role, name FROM users ORDER BY id');
    
    console.log('\n📊 Users found:', result.rows.length);
    result.rows.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Name: ${user.name}`);
    });
    
    // Test getUserByEmail specifically
    console.log('\n🧪 Testing getUserByEmail with admin@friends.org...');
    const adminResult = await query('SELECT id, username, email, password_hash, role, name FROM users WHERE email = $1', ['admin@friends.org']);
    console.log('Admin user found:', adminResult.rows.length > 0 ? 'YES' : 'NO');
    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      console.log(`Admin details: ID=${admin.id}, Email=${admin.email}, Role=${admin.role}`);
      console.log(`Has password_hash: ${admin.password_hash ? 'YES' : 'NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
  
  process.exit(0);
}

checkUsers();