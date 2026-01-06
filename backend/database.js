import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || process.env.DB_CONNECTION_STRING,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

// Initialize database schema
async function initializeSchema() {
  try {
    console.log('🔧 Initializing database schema...');
    const schemaSQL = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSQL);
    console.log('✅ Database schema initialized');
  } catch (err) {
    // Don't throw on schema errors - the schema might already exist
    console.log('ℹ️  Schema initialization had warnings (this is normal if database already exists):', err.message);
    console.log('✅ Continuing with existing schema');
  }
}

// Drop all tables (for development/testing)
async function dropAllTables() {
  try {
    console.log('🗑️  Dropping all tables...');
    await pool.query(`
      DROP TABLE IF EXISTS delivery_attempts CASCADE;
      DROP TABLE IF EXISTS requests CASCADE;
      DROP TABLE IF EXISTS run_team_members CASCADE;
      DROP TABLE IF EXISTS runs CASCADE;
      DROP TABLE IF EXISTS friend_location_history CASCADE;
      DROP TABLE IF EXISTS friends CASCADE;
      DROP TABLE IF EXISTS route_locations CASCADE;
      DROP TABLE IF EXISTS locations CASCADE;
      DROP TABLE IF EXISTS routes CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `);
    console.log('✅ All tables dropped');
  } catch (err) {
    console.error('❌ Failed to drop tables:', err.message);
    throw err;
  }
}

// Reset database (drop + recreate)
async function resetDatabase() {
  console.log('🔄 Resetting database...');
  await dropAllTables();
  await initializeSchema();
  console.log('✅ Database reset complete');
}

// Generic query function
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 100) + '...', duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Query error:', err.message);
    throw err;
  }
}

// Get a client from the pool (for transactions)
async function getClient() {
  return await pool.connect();
}

export {
  pool,
  query,
  getClient,
  testConnection,
  initializeSchema,
  dropAllTables,
  resetDatabase
};