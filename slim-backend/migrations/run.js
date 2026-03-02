// Migration Runner - Friends Outreach CRM V2
// Executes SQL migration files in order

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration(filePath) {
  const client = await pool.connect();
  
  try {
    console.log(`\n📦 Running migration: ${filePath}`);
    
    // Read SQL file
    const sql = readFileSync(filePath, 'utf8');
    
    // Execute migration
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log(`✅ Migration completed successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration failed:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Starting database migration...');
    console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}\n`);
    
    // Run migrations in order
    const migrations = [
      join(__dirname, '001_v2_schema.sql'),
    ];
    
    for (const migration of migrations) {
      await runMigration(migration);
    }
    
    console.log('\n✨ All migrations completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
