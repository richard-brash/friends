// Verify Schema - Check that all tables were created correctly

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifySchema() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Verifying V2 schema...\n');
    
    // Check all tables exist
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables created:');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    
    // Check row counts
    console.log('\n📊 Row counts:');
    for (const table of tables) {
      const { rows } = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`   ${table.table_name}: ${rows[0].count} rows`);
    }
    
    // Check indexes
    const { rows: indexes } = await client.query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    console.log(`\n🔑 Indexes created: ${indexes.length} total`);
    
    // Check constraints
    const { rows: constraints } = await client.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE connamespace = 'public'::regnamespace
      ORDER BY conname
    `);
    
    console.log(`\n✓ Constraints: ${constraints.length} total`);
    
    console.log('\n✅ Schema verification complete!\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await verifySchema();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
