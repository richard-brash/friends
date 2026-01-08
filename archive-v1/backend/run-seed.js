// Simple seeding script
import { resetAndSeed } from './seed.js';

console.log('🌱 Starting database seeding...');

try {
  await resetAndSeed();
  console.log('✅ Database seeded successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Seeding failed:', error.message);
  process.exit(1);
}