// Database Connection Pool
// Centralized PostgreSQL connection management

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config();

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum 10 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected');
});

export default pool;
