// Test friend with location history
import { query } from './database.js';
import CleanFriendService from './services/cleanFriendService.js';

async function testFriendWithHistory() {
  try {
    console.log('🧪 Testing friend with location history...');
    
    const friendService = new CleanFriendService({ query });
    
    // Get a friend by ID (use friend with location history)
    const friend = await friendService.getById(1); // Annette
    
    console.log('✅ Friend data:');
    console.log(`Name: ${friend.name}`);
    console.log(`Current Location: ${friend.locationName}`);
    console.log(`Location History: ${friend.locationHistory ? friend.locationHistory.length : 0} entries`);
    
    if (friend.locationHistory && friend.locationHistory.length > 0) {
      console.log('📍 Location History:');
      friend.locationHistory.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.locationName} (${entry.dateRecorded})`);
        if (entry.notes) console.log(`     Notes: ${entry.notes}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

testFriendWithHistory();