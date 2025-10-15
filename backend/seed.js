import { query, resetDatabase } from './database.js';
import bcrypt from 'bcryptjs';

// Core system users (always created during database initialization)
const CORE_USERS = [
  { username: 'admin', email: 'admin@friendsoutreach.org', password: 'password', role: 'admin', name: 'Admin User', phone: '555-0101' },
  { username: 'coordinator1', email: 'john@friendsoutreach.org', password: 'password', role: 'coordinator', name: 'John Coordinator', phone: '555-0102' },
  { username: 'volunteer1', email: 'sarah@friendsoutreach.org', password: 'password', role: 'volunteer', name: 'Sarah Volunteer', phone: '555-0103' }
];

// Optional sample data (only created when explicitly seeding)
const SAMPLE_DATA = {
  
  routes: [
    { name: 'Downtown Route', description: 'Urban core and surrounding neighborhoods', color: '#1976d2' },
    { name: 'Westside Route', description: 'West side communities and shelters', color: '#388e3c' },
    { name: 'North Route', description: 'Northern districts and camps', color: '#f57c00' }
  ],
  
  locations: [
    // Downtown Route (route_id: 1)
    { route_id: 1, name: 'Central Library', address: '123 Main St', order_in_route: 1 },
    { route_id: 1, name: 'City Park', address: '456 Oak Ave', order_in_route: 2 },
    { route_id: 1, name: 'Community Center', address: '789 First St', order_in_route: 3 },
    { route_id: 1, name: 'Downtown Bridge', address: '321 River Rd', order_in_route: 4 },
    { route_id: 1, name: 'Train Station', address: '654 Station Way', order_in_route: 5 },
    
    // Westside Route (route_id: 2)
    { route_id: 2, name: 'West Park', address: '111 West St', order_in_route: 1 },
    { route_id: 2, name: 'Riverside Camp', address: '222 River Ave', order_in_route: 2 },
    { route_id: 2, name: 'Memorial Gardens', address: '333 Memorial Dr', order_in_route: 3 },
    { route_id: 2, name: 'Industrial District', address: '444 Factory Rd', order_in_route: 4 },
    { route_id: 2, name: 'Shopping Plaza', address: '555 Commerce St', order_in_route: 5 },
    
    // North Route (route_id: 3)
    { route_id: 3, name: 'North Shelter', address: '777 Shelter Dr', order_in_route: 1 },
    { route_id: 3, name: 'Highway Overpass', address: '888 Highway 101', order_in_route: 2 },
    { route_id: 3, name: 'Warehouse District', address: '999 Warehouse Blvd', order_in_route: 3 },
    { route_id: 3, name: 'Food Bank', address: '101 Charity Lane', order_in_route: 4 },
    { route_id: 3, name: 'Transit Hub', address: '202 Transit Way', order_in_route: 5 }
  ],
  
  friends: [
    // Downtown Route friends
    { location_id: 1, name: 'James Miller', nickname: 'Jim', clothing_sizes: { shirt: 'L', pants: '34x32', shoes: '11' }, notes: 'Prefers warm clothing, especially in winter' },
    { location_id: 2, name: 'Maria Garcia', nickname: 'Mari', clothing_sizes: { shirt: 'M', pants: '8', shoes: '7' }, dietary_restrictions: 'Vegetarian' },
    { location_id: 3, name: 'Robert Johnson', nickname: 'Rob', clothing_sizes: { shirt: 'XL', pants: '36x30', shoes: '12' }, notes: 'Has a service dog named Max' },
    { location_id: 4, name: 'Lisa Chen', nickname: null, clothing_sizes: { shirt: 'S', pants: '6', shoes: '8' }, notes: 'Speaks Mandarin and English' },
    { location_id: 5, name: 'David Brown', nickname: 'Dave', clothing_sizes: { shirt: 'M', pants: '32x34', shoes: '10' }, notes: 'Veteran, prefers practical items' },
    
    // Westside Route friends
    { location_id: 6, name: 'Jennifer Lopez', nickname: 'Jen', clothing_sizes: { shirt: 'L', pants: '12', shoes: '9' }, dietary_restrictions: 'Gluten-free' },
    { location_id: 7, name: 'Michael Davis', nickname: 'Mike', clothing_sizes: { shirt: 'XXL', pants: '40x30', shoes: '13' }, notes: 'Collects books, loves reading' },
    { location_id: 8, name: 'Sarah Wilson', nickname: null, clothing_sizes: { shirt: 'M', pants: '10', shoes: '8' }, notes: 'Has three children (ages 5, 8, 12)' },
    { location_id: 9, name: 'Carlos Rodriguez', nickname: 'Carl', clothing_sizes: { shirt: 'L', pants: '33x32', shoes: '11' }, notes: 'Mechanic, needs work clothes' },
    { location_id: 10, name: 'Amanda White', nickname: 'Mandy', clothing_sizes: { shirt: 'S', pants: '4', shoes: '7' }, dietary_restrictions: 'Diabetic' },
    
    // North Route friends
    { location_id: 11, name: 'Thomas Anderson', nickname: 'Tom', clothing_sizes: { shirt: 'XL', pants: '38x32', shoes: '12' }, notes: 'Former construction worker' },
    { location_id: 12, name: 'Patricia Martinez', nickname: 'Patty', clothing_sizes: { shirt: 'L', pants: '14', shoes: '9' }, notes: 'Grandmother of 4, very kind' },
    { location_id: 13, name: 'Kevin Taylor', nickname: null, clothing_sizes: { shirt: 'M', pants: '31x30', shoes: '9' }, notes: 'College student, temporary situation' },
    { location_id: 14, name: 'Linda Jackson', nickname: 'Lin', clothing_sizes: { shirt: 'M', pants: '8', shoes: '8' }, dietary_restrictions: 'Lactose intolerant' },
    { location_id: 15, name: 'Christopher Lee', nickname: 'Chris', clothing_sizes: { shirt: 'L', pants: '34x34', shoes: '10' }, notes: 'Musician, plays guitar' }
  ],
  
  runs: [
    { route_id: 1, name: 'Weekend Downtown Run', scheduled_date: '2024-11-16', start_time: '10:00', status: 'scheduled', created_by: 2 },
    { route_id: 2, name: 'Westside Weekly', scheduled_date: '2024-11-17', start_time: '09:00', status: 'scheduled', created_by: 2 },
    { route_id: 3, name: 'North Route Check-in', scheduled_date: '2024-11-18', start_time: '11:00', status: 'scheduled', created_by: 2 },
    { route_id: 1, name: 'Downtown Express', scheduled_date: '2024-11-20', start_time: '14:00', status: 'scheduled', created_by: 2 },
    { route_id: 2, name: 'Westside Evening Run', scheduled_date: '2024-11-22', start_time: '16:00', status: 'scheduled', created_by: 2 }
  ]
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
    await seedTable('users', usersWithHashedPasswords);
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
    console.log(`- ${SAMPLE_DATA.users.length} users`);
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