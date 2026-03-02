// Fresh Migration - Drop and recreate database
// WARNING: This will DELETE ALL DATA

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function dropSchema() {
  const client = await pool.connect();
  
  try {
    console.log('\n🗑️  Dropping public schema...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    console.log('✅ Schema dropped and recreated');
  } catch (error) {
    console.error('❌ Failed to drop schema:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('\n📦 Running V2 schema migration...');
    
    const sql = readFileSync(join(__dirname, '001_v2_schema.sql'), 'utf8');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function confirm() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('\n⚠️  WARNING: This will DELETE ALL DATA. Continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim() === 'yes');
    });
  });
}

async function main() {
  try {
    console.log('🔥 Fresh Migration - Drop and Recreate Database');
    console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}`);
    
    // Confirm in production
    if (process.env.NODE_ENV === 'production') {
      console.log('\n❌ Cannot run fresh migration in production!');
      process.exit(1);
    }
    
    const confirmed = await confirm();
    if (!confirmed) {
      console.log('\n❌ Migration cancelled');
      process.exit(0);
    }
    
    await dropSchema();
    await runMigration();
    
    console.log('\n✨ Fresh migration completed successfully!\n');
    console.log('💡 Run "npm run seed" to populate with sample data\n');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fresh migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
