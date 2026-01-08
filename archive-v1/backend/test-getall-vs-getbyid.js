// Quick test of getAll vs getById
import { query } from './database.js';
import CleanFriendService from './services/cleanFriendService.js';

async function testGetAllVsGetById() {
  try {
    const service = new CleanFriendService({ query });
    
    console.log('🧪 Testing getAll...');
    const friends = await service.getAll();
    console.log('getAll sample friend:');
    console.log('- Has locationHistory?', 'locationHistory' in friends[0]);
    console.log('- Keys:', Object.keys(friends[0]));
    
    console.log('\n🧪 Testing getById...');
    const friend = await service.getById(1);
    console.log('getById friend:');
    console.log('- Has locationHistory?', 'locationHistory' in friend);
    console.log('- Location history count:', friend.locationHistory ? friend.locationHistory.length : 0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

testGetAllVsGetById();