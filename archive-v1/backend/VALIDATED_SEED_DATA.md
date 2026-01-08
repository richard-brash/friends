# Validated Seed Data Analysis & Issues Found

## Major Issues Identified

### 1. **cleanSampleData.js has BROKEN relationships**
- Friends reference `locationId` but schema uses `friend_location_history` table
- Friends have NO `currentLocationId` field (removed from schema)
- Routes data has duplicate/inconsistent fields (`routeId`, `routeOrder`, `locationIds`)
- Requests have `friendId`/`locationId` but schema uses `friend_id`/`location_id` (snake_case)
- Friend location history references wrong location IDs (don't match the locations data)

### 2. **seed.js uses DIFFERENT sample data than cleanSampleData.js**
- seed.js has its own SAMPLE_DATA with different locations/routes
- This creates confusion about which data is "official"
- seed.js data doesn't match the real routes (AACo, Baltimore City, etc.)

### 3. **Schema Mismatches**
- `friend_location_history` needs proper data for current location tracking
- `run_team_members` shouldn't have `role` column (not in schema, uses created_at for lead)
- Requests need proper `run_id` assignments (some have it, some don't)
- Request status history is MISSING entirely from seed data

### 4. **Date/Time Issues**
- Runs scheduled in 2025 (future dates - should be realistic for testing)
- Some dates are in 2024 (past)
- Need consistent timeline for testing

### 5. **Missing Data**
- No `run_stop_deliveries` data
- No request status history entries
- No proper friend spotting history showing movement between locations

## What Needs to Be Fixed

1. **Remove cleanSampleData.js entirely** - It's broken and inconsistent
2. **Create ONE authoritative seed file** with:
   - Proper snake_case field names matching schema
   - Real routes (AACo, Baltimore City 1, Baltimore City 2)
   - Friends with multiple location history entries
   - Requests properly assigned to runs with correct status flow
   - Request status history tracking
   - Run stop deliveries for completed runs
   - Realistic dates (recent past for completed, near future for scheduled)

3. **Update seed.js to use the corrected data**

4. **Add validation** to ensure:
   - All foreign keys reference valid IDs
   - friend_location_history has entries for each friend
   - Dates are logical (created_at < updated_at, past < future)
   - Request statuses match their workflow

## Recommendation

I should create a **completely new, validated sample dataset** that:
- Matches the current schema exactly
- Has proper relationships
- Tells a coherent story (real routes, friends moving between locations, requests lifecycle)
- Includes ALL tables (friends, locations, routes, runs, requests, histories, team members, deliveries)
- Uses realistic data for actual testing/demo

This will be in a new file that seed.js can import.
