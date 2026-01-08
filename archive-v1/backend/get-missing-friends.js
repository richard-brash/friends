// Get friends without location history
import { query } from './database.js';

async function getFriendsWithoutHistory() {
  try {
    const result = await query('SELECT id, name FROM friends WHERE id >= 8 ORDER BY id');
    console.log('Friends missing location history:');
    result.rows.forEach(row => {
      console.log(`ID ${row.id}: ${row.name}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

getFriendsWithoutHistory();