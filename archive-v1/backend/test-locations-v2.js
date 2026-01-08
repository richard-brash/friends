// Test V2 Locations API
import { query } from './database.js';
import CleanLocationService from './services/cleanLocationService.js';

async function testLocationsV2() {
  try {
    console.log('🧪 Testing V2 Locations API...');
    
    const locationService = new CleanLocationService({ query });
    
    // Test getAll
    console.log('\n📍 Testing getAll...');
    const locations = await locationService.getAll();
    console.log(`✅ Found ${locations.length} locations`);
    console.log('Sample location:', locations[0]);
    
    if (locations.length > 0) {
      // Test getById
      console.log('\n🔍 Testing getById...');
      const location = await locationService.getById(locations[0].id);
      console.log('✅ Location details:', location.name);
      console.log(`   - Friends at location: ${location.currentFriendCount}`);
    }
    
    console.log('\n✅ All V2 Locations API tests passed!');
    
  } catch (error) {
    console.error('❌ V2 Locations API test failed:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

testLocationsV2();