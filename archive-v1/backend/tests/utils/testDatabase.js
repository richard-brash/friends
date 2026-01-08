import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/friends_test',
      ssl: false
    });
  }

  async start() {
    try {
      await this.pool.query('SELECT 1');
      console.log('✅ Test database connected');
    } catch (error) {
      console.error('❌ Test database connection failed:', error.message);
      throw error;
    }
  }

  async stop() {
    await this.pool.end();
    console.log('✅ Test database disconnected');
  }

  async reset() {
    try {
      // Drop all tables and recreate schema
      await this.pool.query(`
        DROP SCHEMA IF EXISTS public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
      `);

      // Load schema
      const schemaPath = path.join(__dirname, '../../schema.sql');
      const schema = await fs.readFile(schemaPath, 'utf8');
      await this.pool.query(schema);

      // Load basic test data
      await this.seed('basic');
    } catch (error) {
      console.error('❌ Failed to reset test database:', error.message);
      throw error;
    }
  }

  async seed(seedType = 'basic') {
    try {
      const seedPath = path.join(__dirname, `../fixtures/${seedType}.sql`);
      const seedData = await fs.readFile(seedPath, 'utf8');
      await this.pool.query(seedData);
    } catch (error) {
      console.error(`❌ Failed to seed test database with ${seedType}:`, error.message);
      throw error;
    }
  }

  async query(text, params) {
    try {
      return await this.pool.query(text, params);
    } catch (error) {
      console.error('❌ Test database query failed:', error.message);
      throw error;
    }
  }

  // Helper method to get a client for transactions
  async getClient() {
    return await this.pool.connect();
  }
}

export const testDb = new TestDatabase();