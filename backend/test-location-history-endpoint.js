// Test the location history endpoint
import { query } from './database.js';
import CleanFriendService from './services/cleanFriendService.js';

async function testLocationHistoryEndpoint() {
  try {
    console.log('🧪 Testing getLocationHistory method...');
    
    const service = new CleanFriendService({ query });
    
    const history = await service.getLocationHistory(1); // Annette
    
    console.log(`✅ Location history for friend 1: ${history.length} entries`);
    history.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.locationName} (${entry.dateRecorded})`);
      if (entry.notes) console.log(`     Notes: ${entry.notes}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

testLocationHistoryEndpoint();