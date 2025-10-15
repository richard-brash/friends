import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function dropAndReset() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('💥 DROPPING ALL TABLES...');
    
    // Drop all tables (in reverse dependency order)
    const dropQueries = [
      'DROP TABLE IF EXISTS delivery_attempts CASCADE;',
      'DROP TABLE IF EXISTS run_team_members CASCADE;',
      'DROP TABLE IF EXISTS requests CASCADE;',
      'DROP TABLE IF EXISTS runs CASCADE;',
      'DROP TABLE IF EXISTS routes CASCADE;',
      'DROP TABLE IF EXISTS locations CASCADE;',
      'DROP TABLE IF EXISTS friends CASCADE;',
      'DROP TABLE IF EXISTS users CASCADE;'
    ];

    for (const query of dropQueries) {
      console.log(`Executing: ${query}`);
      await client.query(query);
    }

    console.log('✅ All tables dropped!');
    console.log('🔄 Now restart your server and it will recreate everything fresh!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('👋 Database connection closed');
  }
}

dropAndReset();