import { query } from './database.js';

async function verifySampleData() {
  try {
    console.log('📋 Sample Routes Created:');
    const routes = await query('SELECT id, name, description FROM routes ORDER BY id');
    routes.rows.forEach(route => {
      console.log(`- ${route.name}: ${route.description}`);
    });
    
    console.log('\n👥 Sample Friends:');
    const friends = await query('SELECT f.name, l.name as location FROM friends f JOIN locations l ON f.location_id = l.id ORDER BY f.id LIMIT 5');
    friends.rows.forEach(friend => {
      console.log(`- ${friend.name} at ${friend.location}`);
    });
    
    console.log('\n🏃 Sample Runs Available:');
    const runs = await query('SELECT r.name, rt.name as route_name, r.scheduled_date, r.status FROM runs r JOIN routes rt ON r.route_id = rt.id ORDER BY r.scheduled_date');
    runs.rows.forEach(run => {
      const date = new Date(run.scheduled_date).toLocaleDateString();
      console.log(`- ${run.name} (${run.route_name}) - ${run.status} on ${date}`);
    });
    
    console.log('\n📋 Sample Requests:');
    const requests = await query('SELECT r.item_name, f.name as friend_name, r.priority, r.status FROM requests r JOIN friends f ON r.friend_id = f.id ORDER BY r.id LIMIT 5');
    requests.rows.forEach(request => {
      console.log(`- ${request.item_name} for ${request.friend_name} (${request.priority} priority, ${request.status})`);
    });
    
    console.log('\n✅ Database is fully populated for pre-alpha demo!');
    console.log('🎯 Users can now log in and see a working system with real-looking data.');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  process.exit(0);
}

verifySampleData();