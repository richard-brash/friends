// Check current database state
import { query } from './database.js';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database state...');
    
    // Check if tables exist
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Current tables in database:');
    if (result.rows.length === 0) {
      console.log('❌ No tables found - database is empty');
    } else {
      result.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    // If friends table exists, check data
    if (result.rows.some(row => row.table_name === 'friends')) {
      const friendsResult = await query('SELECT COUNT(*) as count FROM friends');
      console.log(`\n👥 Friends in database: ${friendsResult.rows[0].count}`);
      
      const historyResult = await query('SELECT COUNT(*) as count FROM friend_location_history');
      console.log(`📍 Location history entries: ${historyResult.rows[0].count}`);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
  
  process.exit(0);
}

checkDatabase();