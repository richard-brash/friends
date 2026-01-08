// Check friend location data
import { query } from './database.js';

async function checkFriendLocationData() {
  try {
    console.log('🔍 Checking friend location data...');
    
    // Check friends table
    const friendsResult = await query('SELECT COUNT(*) as count FROM friends');
    console.log(`📊 Friends in database: ${friendsResult.rows[0].count}`);
    
    // Check friend_location_history table
    const historyResult = await query('SELECT COUNT(*) as count FROM friend_location_history');
    console.log(`📊 Location history entries: ${historyResult.rows[0].count}`);
    
    // Sample friends with their current location
    const sampleResult = await query(`
      SELECT 
        f.name,
        f.id as friend_id,
        flh_current.location_id,
        l.name as location_name
      FROM friends f
      LEFT JOIN LATERAL (
        SELECT location_id
        FROM friend_location_history flh
        WHERE flh.friend_id = f.id
        ORDER BY flh.created_at DESC
        LIMIT 1
      ) flh_current ON true
      LEFT JOIN locations l ON flh_current.location_id = l.id
      LIMIT 5
    `);
    
    console.log('\n🧑‍🤝‍🧑 Sample friends with locations:');
    sampleResult.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.location_name || 'NO LOCATION'}`);
    });
    
    // Check the V2 API response
    console.log('\n🔍 Testing V2 Friends API response...');
    const { default: CleanFriendService } = await import('./services/cleanFriendService.js');
    const friendService = new CleanFriendService({ query });
    const friends = await friendService.getAll();
    
    console.log(`✅ V2 API returned ${friends.length} friends`);
    if (friends.length > 0) {
      console.log('Sample friend from V2 API:');
      console.log(JSON.stringify(friends[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkFriendLocationData();