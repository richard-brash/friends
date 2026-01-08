import { query, resetDatabase } from './database.js';
import bcrypt from 'bcryptjs';

// Import validated sample data
import {
  sampleUsers,
  sampleRoutes,
  sampleLocations,
  sampleFriends,
  sampleFriendLocationHistory,
  sampleRuns,
  sampleRunTeamMembers,
  sampleRequests,
  sampleRequestStatusHistory,
  sampleRunStopDeliveries
} from './validatedSampleData.js';

// Function to seed a single table
async function seedTable(tableName, data, returningColumn = 'id') {
  console.log(`📝 Seeding ${tableName} table...`);
  const results = [];
  
  for (const item of data) {
    // Filter out undefined values and null run_id (removed from schema)
    const cleanItem = Object.fromEntries(
      Object.entries(item).filter(([k, v]) => {
        if (v === undefined) return false;
        if (k === 'run_id' && v === null) return false; // run_id removed from schema
        return true;
      })
    );
    
    const columns = Object.keys(cleanItem);
    const values = Object.values(cleanItem);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING ${returningColumn}
    `;
    
    try {
      const result = await query(sql, values);
      results.push(result.rows[0]);
    } catch (err) {
      console.error(`Error seeding ${tableName}:`, err.message);
      console.error('Failed record:', cleanItem);
      throw err;
    }
  }
  
  console.log(`✅ Seeded ${results.length} records in ${tableName}`);
  return results;
}



// Hash passwords for users
async function hashPasswords(users) {
  const saltRounds = 10;
  const hashedUsers = [];
  
  for (const user of users) {
    const password_hash = await bcrypt.hash(user.password, saltRounds);
    // Create new object with password_hash, remove password field
    hashedUsers.push({
      ...user,
      password_hash,
      password: undefined
    });
    delete hashedUsers[hashedUsers.length - 1].password;
  }
  
  return hashedUsers;
}

// Check if database already has data
async function isDatabaseEmpty() {
  try {
    const result = await query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);
    return userCount === 0;
  } catch (error) {
    console.log('Could not check if database is empty, assuming it needs seeding');
    return true;
  }
}

// Seed sample data (full validated dataset)
async function seedSampleData() {
  console.log('🌱 Starting comprehensive sample data seeding...');
  
  try {
    // Check if data already exists
    const routeResult = await query('SELECT COUNT(*) FROM routes');
    const routeCount = parseInt(routeResult.rows[0].count);
    
    if (routeCount > 0) {
      console.log('ℹ️  Sample data already exists. Use /api/reset to clear and reseed.');
      return;
    }
    
    // Hash passwords for users
    console.log('🔐 Hashing user passwords...');
    const usersWithHashedPasswords = await hashPasswords([...sampleUsers]);
    
    // Seed in order (respecting foreign key constraints)
    console.log('\n📝 Seeding tables in dependency order...');
    
    await seedTable('users', usersWithHashedPasswords, 'id');
    await seedTable('routes', sampleRoutes, 'id');
    await seedTable('locations', sampleLocations, 'id');
    await seedTable('friends', sampleFriends, 'id');
    await seedTable('friend_location_history', sampleFriendLocationHistory, 'id');
    await seedTable('runs', sampleRuns, 'id');
    await seedTable('run_team_members', sampleRunTeamMembers, 'id');
    await seedTable('requests', sampleRequests, 'id');
    await seedTable('request_status_history', sampleRequestStatusHistory, 'id');
    await seedTable('run_stop_deliveries', sampleRunStopDeliveries, 'id');
    
    console.log('\n🎉 Database seeding completed successfully!');
    
    // Summary
    console.log('\n📊 Comprehensive Data Summary:');
    console.log(`- ${usersWithHashedPasswords.length} users`);
    console.log(`- ${sampleRoutes.length} routes`);  
    console.log(`- ${sampleLocations.length} locations`);
    console.log(`- ${sampleFriends.length} friends`);
    console.log(`- ${sampleFriendLocationHistory.length} friend location history entries`);
    console.log(`- ${sampleRuns.length} runs (2 completed, 1 in_progress, 3 scheduled)`);
    console.log(`- ${sampleRunTeamMembers.length} team member assignments`);
    console.log(`- ${sampleRequests.length} requests (5 delivered, 3 in_progress, 7 pending)`);
    console.log(`- ${sampleRequestStatusHistory.length} status history entries`);
    console.log(`- ${sampleRunStopDeliveries.length} run stop delivery records`);
    
    return true;
  } catch (err) {
    console.error('❌ Sample data seeding failed:', err.message);
    console.error('Stack trace:', err.stack);
    throw err;
  }
}

// Reset and seed database with sample data
async function resetAndSeed() {
  console.log('🔄 Resetting database and seeding with validated sample data...\n');
  await resetDatabase();
  await seedSampleData();
}

export {
  seedSampleData, 
  resetAndSeed,
  isDatabaseEmpty
};