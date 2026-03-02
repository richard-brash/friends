import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testPassword() {
  try {
    // Get the admin user from database
    const result = await pool.query(
      "SELECT email, password_hash FROM users WHERE email = 'admin@friendsoutreach.org'"
    );
    
    if (result.rows.length === 0) {
      console.log('❌ No user found with email admin@friendsoutreach.org');
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log('✅ Found user:', user.email);
    console.log('Password hash:', user.password_hash);
    
    // Test the password
    const testPassword = 'password123';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    
    console.log(`\nTesting password: "${testPassword}"`);
    console.log('Result:', isValid ? '✅ VALID' : '❌ INVALID');
    
    // Generate a new hash for comparison
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('\nNew hash generated:', newHash);
    const newHashValid = await bcrypt.compare(testPassword, newHash);
    console.log('New hash validates:', newHashValid ? '✅ YES' : '❌ NO');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testPassword();
