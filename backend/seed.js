import { query, resetDatabase } from './database.js';
import bcrypt from 'bcryptjs';

// Core system users (always created during database initialization)
const CORE_USERS = [
  { username: 'admin', email: 'admin@friendsoutreach.org', password: 'password', role: 'admin', name: 'Admin User', phone: '555-0101' },
  { username: 'coordinator1', email: 'john@friendsoutreach.org', password: 'password', role: 'coordinator', name: 'John Coordinator', phone: '555-0102' },
  { username: 'volunteer1', email: 'sarah@friendsoutreach.org', password: 'password', role: 'volunteer', name: 'Sarah Volunteer', phone: '555-0103' }
];

// Import real sample data from cleanSampleData.js
import { 
  sampleRoutes as realSampleRoutes,
  sampleLocations as realSampleLocations,
  sampleFriends as realSampleFriends,
  sampleRuns as realSampleRuns,
  sampleRequests as realSampleRequests
} from './cleanSampleData.js';

// Convert real sample data to database format
const SAMPLE_DATA = {
  
  routes: realSampleRoutes.map(route => ({
    name: route.name,
    description: route.description,
    color: route.color || '#1976d2'
  })),
  
  locations: realSampleLocations.map((location, index) => {
    // Map route IDs: '1' -> 1, '2' -> 2, '3' -> 3
    const routeId = parseInt(location.routeId);
    
    // Calculate order within route based on sequence in the array
    const locationsInSameRoute = realSampleLocations.filter((loc, i) => 
      i <= index && loc.routeId === location.routeId
    );
    
    return {
      route_id: routeId,
      name: location.name,
      address: location.address,
      order_in_route: locationsInSameRoute.length
    };
  }),
  
  friends: realSampleFriends.map(friend => {
    // Map location IDs from string to number and find corresponding database location_id
    const locationIndex = realSampleLocations.findIndex(loc => loc.id === friend.locationId);
    const location_id = locationIndex + 1; // Database IDs start at 1
    
    return {
      location_id: location_id,
      name: friend.name,
      nickname: friend.nickname || null,
      clothing_sizes: {},
      notes: friend.notes,
      dietary_restrictions: friend.dietary_restrictions || null
    };
  }),
  
  runs: realSampleRuns.map(run => {
    const routeId = parseInt(run.routeId);
    const scheduledDate = new Date(run.scheduledDate);
    
    return {
      route_id: routeId,
      name: `${realSampleRoutes.find(r => r.id === run.routeId)?.name || 'Route'} Run`,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      start_time: scheduledDate.toTimeString().split(' ')[0].substring(0, 5),
      status: run.status,
      created_by: 2 // John Coordinator
    };
  })
};

// Function to seed a single table
async function seedTable(tableName, data, returningColumn = 'id') {
  console.log(`📝 Seeding ${tableName} table...`);
  const results = [];
  
  for (const item of data) {
    const columns = Object.keys(item);
    const values = Object.values(item);
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
      throw err;
    }
  }
  
  console.log(`✅ Seeded ${results.length} records in ${tableName}`);
  return results;
}

// Hash passwords for users
async function hashPasswords(users) {
  const saltRounds = 10;
  for (const user of users) {
    user.password_hash = await bcrypt.hash(user.password, saltRounds);
    delete user.password; // Remove plain password
  }
  return users;
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

// Create core system users (always needed)
async function createCoreUsers() {
  console.log('👥 Creating core system users...');
  
  // Check if users already exist
  const result = await query('SELECT COUNT(*) FROM users');
  const userCount = parseInt(result.rows[0].count);
  
  if (userCount > 0) {
    console.log('ℹ️  Core users already exist, skipping');
    return;
  }
  
  // Hash passwords for core users
  const coreUsersWithHashedPasswords = await hashPasswords([...CORE_USERS]);
  await seedTable('users', coreUsersWithHashedPasswords);
  console.log('✅ Core system users created');
}

// Seed sample data (optional)
async function seedSampleData() {
  console.log('🌱 Starting sample data seeding...');
  
  // Check if sample data already exists (check routes as indicator)
  const routeResult = await query('SELECT COUNT(*) FROM routes');
  const routeCount = parseInt(routeResult.rows[0].count);
  
  if (routeCount > 0) {
    console.log('ℹ️  Sample data already exists, skipping');
    return;
  }
  
  try {
    
    // Seed in order (respecting foreign key constraints)
    // Core users already exist, so just seed the operational data
    await seedTable('routes', SAMPLE_DATA.routes);
    await seedTable('locations', SAMPLE_DATA.locations);
    await seedTable('friends', SAMPLE_DATA.friends);
    await seedTable('runs', SAMPLE_DATA.runs);
    
    // Generate some sample requests
    const sampleRequests = [
      { friend_id: 1, category: 'clothing', item_name: 'Winter Coat', description: 'Large winter coat, preferably dark color', priority: 'high', status: 'pending' },
      { friend_id: 2, category: 'non-clothing', item_name: 'Canned Food', description: 'Vegetarian canned meals', priority: 'medium', status: 'ready_for_delivery', run_id: 1 },
      { friend_id: 3, category: 'clothing', item_name: 'Work Boots', description: 'Size 12, steel toe preferred', priority: 'medium', status: 'taken', taken_by: 2 },
      { friend_id: 6, category: 'non-clothing', item_name: 'Gluten-free Bread', description: 'Any gluten-free bread products', priority: 'low', status: 'pending' },
      { friend_id: 8, category: 'clothing', item_name: 'Children\'s Clothes', description: 'Clothes for kids ages 5, 8, and 12', priority: 'high', status: 'ready_for_delivery', run_id: 2 },
      { friend_id: 11, category: 'clothing', item_name: 'Work Pants', description: 'Heavy-duty work pants, size 38x32', priority: 'medium', status: 'pending' },
      { friend_id: 14, category: 'non-clothing', item_name: 'Lactose-free Milk', description: 'Non-dairy milk alternatives', priority: 'low', status: 'ready_for_delivery', run_id: 3 },
      { friend_id: 5, category: 'clothing', item_name: 'Socks and Underwear', description: 'Basic undergarments, size M', priority: 'high', status: 'taken', taken_by: 3 },
      { friend_id: 12, category: 'non-clothing', item_name: 'Reading Glasses', description: '+2.0 reading glasses', priority: 'medium', status: 'pending' }
    ];
    
    await seedTable('requests', sampleRequests);
    
    // Add team members to runs
    const teamMembers = [
      { run_id: 1, user_id: 2, role: 'coordinator' },
      { run_id: 1, user_id: 3, role: 'volunteer' },
      { run_id: 2, user_id: 2, role: 'coordinator' },
      { run_id: 3, user_id: 2, role: 'coordinator' }
    ];
    
    await seedTable('run_team_members', teamMembers);
    
    console.log('🎉 Database seeding completed successfully!');
    
    // Summary
    console.log('\n📊 Seeded Data Summary:');
    console.log(`- 3 core users (admin, coordinator, volunteer)`);
    console.log(`- ${SAMPLE_DATA.routes.length} routes`);  
    console.log(`- ${SAMPLE_DATA.locations.length} locations`);
    console.log(`- ${SAMPLE_DATA.friends.length} friends`);
    console.log(`- ${SAMPLE_DATA.runs.length} runs`);
    console.log(`- ${sampleRequests.length} requests`);
    console.log(`- ${teamMembers.length} team assignments`);
    
    return true;
  } catch (err) {
    console.error('❌ Sample data seeding failed:', err.message);
    throw err;
  }
}

// Main database initialization (core users only)
async function seedDatabase() {
  console.log('🌱 Starting database initialization...');
  await createCoreUsers();
  console.log('✅ Database initialization complete');
}

// Reset and seed database with sample data
async function resetAndSeed() {
  await resetDatabase();
  await createCoreUsers();
  await seedSampleData();
}

export {
  seedDatabase,
  seedSampleData, 
  resetAndSeed,
  isDatabaseEmpty,
  SAMPLE_DATA
};