#!/usr/bin/env node

/**
 * Database Population Script
 * 
 * Loads sample data into the PostgreSQL database from cleanSampleData.js
 * Run with: node populate-database.js
 */

import { query, testConnection, initializeSchema, resetDatabase } from './database.js';
import { 
  sampleUsers, 
  sampleLocations, 
  sampleRoutes, 
  sampleFriends, 
  sampleFriendLocationHistory,
  sampleRuns, 
  sampleRunTeamMembers,
  sampleRequests,
  sampleDeliveryAttempts as sampleStatusHistory
} from './cleanSampleData.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function hashPasswords(users) {
  const hashedUsers = [];
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    // Only include fields that exist in the users table schema
    hashedUsers.push({
      id: user.id,
      username: user.email.split('@')[0], // Generate username from email
      email: user.email,
      password_hash: hashedPassword,
      role: user.role,
      name: user.name,
      phone: user.phone
    });
  }
  return hashedUsers;
}

async function insertData(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`⚠️  No data to insert for ${tableName}`);
    return;
  }

  console.log(`📝 Inserting ${data.length} records into ${tableName}...`);
  
  for (const record of data) {
    const keys = Object.keys(record);
    const values = Object.values(record);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const keysList = keys.join(', ');
    
    const insertQuery = `
      INSERT INTO ${tableName} (${keysList})
      VALUES (${placeholders})
    `;
    
    try {
      await query(insertQuery, values);
    } catch (error) {
      console.error(`❌ Failed to insert into ${tableName}:`, error.message);
      console.error('Record:', record);
      throw error;
    }
  }
  
  console.log(`✅ Inserted ${data.length} records into ${tableName}`);
}

async function populateDatabase() {
  try {
    console.log('🚀 Starting database population...');
    
    // Test connection
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connected');
    
    // Initialize schema
    console.log('🔧 Initializing database schema...');
    await initializeSchema();
    console.log('✅ Schema initialized');
    
    // Reset database (optional - comment out if you want to keep existing data)
    console.log('🗑️  Resetting database...');
    await resetDatabase();
    console.log('✅ Database reset');
    
    // Re-initialize schema after reset
    await initializeSchema();
    
    // Hash passwords for users
    console.log('🔐 Hashing passwords...');
    const usersWithHashedPasswords = await hashPasswords(sampleUsers);
    
    // Clean data to match NEW schema before inserting
    const cleanRoutes = sampleRoutes.map(route => ({
      id: route.id,
      name: route.name,
      description: route.description,
      color: route.color || '#1976d2'
    }));
    
    // Locations now include route_id and route_order directly
    const cleanLocations = sampleLocations.map(location => ({
      id: location.id,
      name: location.name,
      address: location.address,
      type: location.type,
      coordinates: location.coordinates ? JSON.stringify(location.coordinates) : null,
      notes: location.notes,
      route_id: location.routeId || null,
      route_order: location.routeOrder || null
    }));
    
    // Friends - removed current_location_id (now tracked via friend_location_history)
    const cleanFriends = sampleFriends.map(friend => ({
      id: friend.id,
      name: friend.name,
      nickname: friend.nickname,
      email: friend.email,
      phone: friend.phone,
      notes: friend.notes,
      clothing_sizes: friend.clothingSizes ? JSON.stringify(friend.clothingSizes) : null,
      dietary_restrictions: friend.dietaryRestrictions,
      status: friend.status || 'active',
      last_contact: friend.lastContact ? new Date(friend.lastContact) : null
    }));
    
    // Friend location history (let database auto-generate IDs)
    const cleanFriendLocationHistory = sampleFriendLocationHistory.map(history => ({
      friend_id: history.friendId,
      location_id: history.locationId,
      date_recorded: new Date(history.dateRecorded),
      notes: history.notes,
      recorded_by: history.recordedBy
    }));
    
    const cleanRuns = sampleRuns.map(run => ({
      id: run.id,
      route_id: run.route_id,
      name: run.name,
      scheduled_date: run.scheduled_date,
      start_time: run.start_time,
      end_time: run.end_time,
      meal_count: run.meal_count,
      status: run.status,
      notes: run.notes,
      created_by: run.created_by
    }));
    
    const cleanRunTeamMembers = sampleRunTeamMembers.map(member => ({
      run_id: member.run_id,
      user_id: member.user_id,
      created_at: member.created_at
    }));
    
    const cleanRequests = sampleRequests.map(request => ({
      id: request.id,
      friend_id: request.friendId || request.friend_id,
      location_id: request.locationId || request.location_id,
      run_id: request.runId || request.run_id,
      category: request.itemCategory || request.category,
      item_name: request.itemRequested || request.itemName || request.item_name,
      description: request.itemDetails || request.description,
      quantity: request.quantity || 1,
      priority: request.urgency || request.priority || 'medium',
      status: request.status,
      notes: request.specialInstructions || request.notes,
      taken_by: request.takenByUserId || request.takenBy || request.taken_by,
      delivered_by: request.deliveredByUserId || request.deliveredBy || request.delivered_by
    }));

    // Insert data in proper order (respecting foreign key constraints)
    await insertData('users', usersWithHashedPasswords);
    await insertData('routes', cleanRoutes);
    await insertData('locations', cleanLocations); // Locations now include route_id and route_order
    await insertData('friends', cleanFriends);
    await insertData('friend_location_history', cleanFriendLocationHistory); // Friend location history
    await insertData('runs', cleanRuns);
    await insertData('run_team_members', cleanRunTeamMembers); // Team member assignments
    await insertData('requests', cleanRequests); // Now includes location_id
    
    // Fix PostgreSQL sequences after inserting sample data with explicit IDs
    console.log('🔧 Fixing table sequences...');
    await query("SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true);");
    await query("SELECT setval(pg_get_serial_sequence('routes', 'id'), COALESCE((SELECT MAX(id) FROM routes), 1), true);");
    await query("SELECT setval(pg_get_serial_sequence('locations', 'id'), COALESCE((SELECT MAX(id) FROM locations), 1), true);");
    await query("SELECT setval(pg_get_serial_sequence('friends', 'id'), COALESCE((SELECT MAX(id) FROM friends), 1), true);");
    await query("SELECT setval(pg_get_serial_sequence('runs', 'id'), COALESCE((SELECT MAX(id) FROM runs), 1), true);");
    await query("SELECT setval(pg_get_serial_sequence('requests', 'id'), COALESCE((SELECT MAX(id) FROM requests), 1), true);");
    console.log('✅ All sequences updated');
    
    // Clean status history data - map old delivery_attempts to new request_status_history
    const cleanStatusHistory = sampleStatusHistory.map(attempt => {
      // Map old 'delivered' and 'not_delivered' outcomes to new status values
      let status;
      if (attempt.outcome === 'delivered') {
        status = 'delivered';
      } else if (attempt.outcome === 'not_delivered') {
        status = 'delivery_attempt_failed';
      } else {
        status = attempt.outcome; // In case there are other values
      }
      
      return {
        request_id: attempt.requestId || attempt.request_id,
        status: status,
        notes: attempt.notes,
        user_id: attempt.userId || attempt.user_id,
        created_at: new Date(attempt.attemptDate || attempt.attempt_date || attempt.createdAt)
      };
    });

    if (cleanStatusHistory && cleanStatusHistory.length > 0) {
      await insertData('request_status_history', cleanStatusHistory);
    }
    
    console.log('🎉 Database population complete!');
    
    // Show final counts
    const userCount = await query('SELECT COUNT(*) FROM users');
    const routeCount = await query('SELECT COUNT(*) FROM routes');
    const locationCount = await query('SELECT COUNT(*) FROM locations');
    const friendCount = await query('SELECT COUNT(*) FROM friends');
    const friendLocationHistoryCount = await query('SELECT COUNT(*) FROM friend_location_history');
    const runCount = await query('SELECT COUNT(*) FROM runs');
    const requestCount = await query('SELECT COUNT(*) FROM requests');
    const statusHistoryCount = await query('SELECT COUNT(*) FROM request_status_history');
    
    console.log('📊 Final counts:');
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Routes: ${routeCount.rows[0].count}`);
    console.log(`   Locations: ${locationCount.rows[0].count} (now with route assignments)`);
    console.log(`   Friends: ${friendCount.rows[0].count}`);
    console.log(`   Friend Location History: ${friendLocationHistoryCount.rows[0].count}`);
    console.log(`   Runs: ${runCount.rows[0].count}`);
    console.log(`   Requests: ${requestCount.rows[0].count}`);
    console.log(`   Status History: ${statusHistoryCount.rows[0].count}`);
    
    console.log('✅ Database ready for use!');
    
  } catch (error) {
    console.error('❌ Database population failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
populateDatabase();