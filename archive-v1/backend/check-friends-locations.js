// Check friends without location history
import { query } from './database.js';

async function checkFriendsLocationCounts() {
  try {
    const result = await query(`
      SELECT 
        f.id,
        f.name, 
        COUNT(flh.id) as location_count 
      FROM friends f 
      LEFT JOIN friend_location_history flh ON f.id = flh.friend_id 
      GROUP BY f.id, f.name 
      ORDER BY location_count, f.name
    `);
    
    console.log('Friends and their location counts:');
    const friendsWithoutLocations = [];
    
    result.rows.forEach(row => {
      const count = parseInt(row.location_count);
      console.log(`${row.name}: ${count} locations`);
      if (count === 0) {
        friendsWithoutLocations.push({ id: row.id, name: row.name });
      }
    });
    
    console.log(`\n❌ Friends missing location history: ${friendsWithoutLocations.length}`);
    friendsWithoutLocations.forEach(friend => {
      console.log(`  - ${friend.name} (ID: ${friend.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkFriendsLocationCounts();