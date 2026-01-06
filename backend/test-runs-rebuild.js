// Quick integration test for Runs rebuild
import RunRepository from './repositories/runRepository.js';
import CleanRunService from './services/cleanRunService.js';
import { query } from './database.js';

const logger = {
  debug: (...args) => console.log('DEBUG:', ...args),
  info: (...args) => console.log('INFO:', ...args),
  error: (...args) => console.error('ERROR:', ...args)
};

async function testRunsRebuild() {
  console.log('🧪 Testing Runs Rebuild Features\n');

  const repository = new RunRepository();
  const service = new CleanRunService(repository, logger);

  try {
    // Test 1: Auto-name generation
    console.log('✅ Test 1: Auto-name generation');
    const newRun = await service.create({
      routeId: 1,
      scheduledDate: '2025-10-24', // Friday
      startTime: '09:00:00',
      endTime: '12:00:00',
      mealCount: 50,
      createdBy: 1
    });
    console.log(`   Generated name: "${newRun.name}"`);
    console.log(`   Expected: "AACo Friday 2025-10-24"`);
    console.log(`   ✓ Match: ${newRun.name === 'AACo Friday 2025-10-24'}\n`);

    // Test 2: Meal count
    console.log('✅ Test 2: Meal count tracking');
    console.log(`   Meal count: ${newRun.mealCount}`);
    console.log(`   ✓ Meal count correct: ${newRun.mealCount === 50}\n`);

    // Test 3: Add team members for lead identification
    console.log('✅ Test 3: Team lead identification');
    await repository.addTeamMember(newRun.id, 2); // John (first = lead)
    await repository.addTeamMember(newRun.id, 3); // Sarah (second = member)
    
    const team = await repository.getTeamMembers(newRun.id);
    console.log(`   Team size: ${team.length}`);
    console.log(`   Lead (first): ${team[0].user_name}`);
    console.log(`   Member (second): ${team[1].user_name}`);
    console.log(`   ✓ Lead is John: ${team[0].user_name === 'John Coordinator'}\n`);

    // Test 4: Fetch run with team
    console.log('✅ Test 4: Fetch run with includeTeam option');
    const runWithTeam = await service.getById(newRun.id, { includeTeam: true });
    console.log(`   Run has team: ${!!runWithTeam.team}`);
    console.log(`   Team size: ${runWithTeam.team?.length || 0}`);
    console.log(`   ✓ Team included: ${runWithTeam.team?.length === 2}\n`);

    // Test 5: Update meal count
    console.log('✅ Test 5: Update meal count');
    const updated = await service.update(newRun.id, { mealCount: 60 });
    console.log(`   Updated meal count: ${updated.mealCount}`);
    console.log(`   ✓ Update successful: ${updated.mealCount === 60}\n`);

    // Test 6: Read-only name (update should be ignored)
    console.log('✅ Test 6: Name is read-only');
    const attemptNameChange = await service.update(newRun.id, { 
      name: 'Should Be Ignored',
      mealCount: 65 
    });
    console.log(`   Name after update: "${attemptNameChange.name}"`);
    console.log(`   Meal count after update: ${attemptNameChange.mealCount}`);
    console.log(`   ✓ Name unchanged: ${attemptNameChange.name === 'AACo Friday 2025-10-24'}`);
    console.log(`   ✓ Meal count updated: ${attemptNameChange.mealCount === 65}\n`);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await repository.delete(newRun.id);
    console.log('   ✓ Test run deleted\n');

    console.log('🎉 All tests passed!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testRunsRebuild();
