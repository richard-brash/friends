// Manually execute schema
import { query } from './database.js';
import fs from 'fs';

async function executeSchema() {
  try {
    console.log('Reading schema file...');
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    
    console.log('Executing schema...');
    await query(schema);
    
    console.log('✅ Schema executed successfully');
    
    // Check if tables were created
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tables created:');
    result.rows.forEach(row => {
      console.log('- ' + row.table_name);
    });
    
  } catch (error) {
    console.error('❌ Schema execution failed:', error.message);
  }
  
  process.exit(0);
}

executeSchema();