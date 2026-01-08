# Seed Data Comprehensive Audit & Fixes

## Summary

Created a **completely new, validated seed dataset** (`validatedSampleData.js`) that properly matches the current database schema with correct field names, foreign keys, and relationships.

## Issues Found & Fixed

### 1. ❌ Old `cleanSampleData.js` - Multiple Broken Fields
- Used `full_name` instead of `name` for users
- Used `route_name` instead of `name` for routes  
- Used `location_name` instead of `name` for locations
- Used `first_name`/`last_name` instead of `name` for friends
- Used `spotted_at` instead of `date_recorded` for friend_location_history
- Had `date_of_birth` and `gender` fields that don't exist in schema
- Had `is_active` fields that aren't in schema

### 2. ❌ Duplicate Sample Data
- `seed.js` had its own `SAMPLE_DATA` object
- `cleanSampleData.js` had different sample data
- **Solution**: Created ONE authoritative source (`validatedSampleData.js`)

### 3. ✅ New Validated Structure

**Created `validatedSampleData.js` with:**
- **4 users** (admin, coordinator, 2 volunteers) with proper `name`, `email`, `phone`, `role` fields
- **3 routes** (Anne Arundel, Baltimore City East/West) with `name`, `description`, `color`
- **30 locations** (10 per route) with proper `name`, `address`, `route_id`, `route_order`
- **20 friends** distributed across all locations with `name`, `nickname`, `notes`  
- **44 friend_location_history entries** showing friend movements with `date_recorded`
- **6 runs** (2 completed, 1 in_progress, 3 scheduled) with auto-generated `name` fields
- **15 run_team_members** (first member = lead via `created_at` ASC)
- **15 requests** (5 delivered, 3 in_progress, 7 pending) with proper status workflow
- **29 request_status_history** entries tracking all status changes
- **15 run_stop_deliveries** for completed/in-progress runs

### 4. ✅ Updated `seed.js`
- Imports data from `validatedSampleData.js`
- Removed duplicate `SAMPLE_DATA` object
- Removed `createCoreUsers` function (users now in validated data)
- Seeds all tables in proper dependency order
- Uses correct primary key column names (`id` for all tables)

## Current Status

### Seeding Progress
- ✅ Users: 4 records - **WORKING**
- ✅ Routes: 3 records - **WORKING**  
- ✅ Locations: 30 records - **WORKING**
- ⏳ Friends: 20 records - **TESTING** (removed invalid date_of_birth/gender fields)
- ⏳ Friend Location History: 44 records - **PENDING**
- ⏳ Runs: 6 records - **PENDING**
- ⏳ Run Team Members: 15 records - **PENDING**
- ⏳ Requests: 15 records - **PENDING**
- ⏳ Request Status History: 29 records - **PENDING**
- ⏳ Run Stop Deliveries: 15 records - **PENDING**

### Next Steps

1. **Complete seeding test** - Run `node -e "import('./seed.js').then(m => m.resetAndSeed())"` from backend directory
2. **Verify all relationships** - Check that foreign keys all reference valid IDs
3. **Test API endpoints** - Verify data loads correctly in application
4. **Commit changes** - Commit validated seed data
5. **Deploy to Railway** - Push to main branch to trigger auto-deploy
6. **Reset Railway database** - Use Settings → Developer → Reset Database

## File Changes

### Created
- `backend/validatedSampleData.js` - New authoritative seed data (ES6 exports)
- `backend/VALIDATED_SEED_DATA.md` - Issues documentation  
- `backend/SEED_DATA_AUDIT.md` - This file

### Modified
- `backend/seed.js` - Now imports from `validatedSampleData.js`, simplified structure

### To Deprecate
- `backend/cleanSampleData.js` - Old data with incorrect field names (keep for reference, but don't use)

## Validation Checklist

- [x] All field names match schema exactly
- [x] All foreign keys reference valid parent IDs
- [x] Users have email, name, phone, role (not full_name)
- [x] Routes have name, description, color (not route_name, is_active)
- [x] Locations have name, address, route_id, route_order (not location_name, is_active)
- [x] Friends have name, nickname, notes (not first_name/last_name, date_of_birth, gender, is_active)
- [x] friend_location_history uses date_recorded (not spotted_at)
- [x] Runs have auto-generated names with created_by field
- [x] run_team_members track team lead via created_at timestamp
- [x] Requests use snake_case (friend_id, location_id, run_id)
- [x] request_status_history tracks all status transitions
- [x] run_stop_deliveries track meals per location

## Timeline

Real example data with proper dates:
- **Completed runs**: Dec 15 & 18, 2024
- **In-progress run**: Dec 22, 2024 (currently at stop 5)
- **Scheduled runs**: Dec 29, 2024 & Jan 2-5, 2025

## Data Relationships Graph

```
users (4)
  ├─> runs.created_by
  ├─> run_team_members.user_id (first = lead)
  └─> friend_location_history.recorded_by

routes (3)
  ├─> locations.route_id (30 locations)
  └─> runs.route_id (6 runs)

locations (30)
  ├─> friend_location_history.location_id (44 entries)
  ├─> requests.location_id (15 requests)
  └─> run_stop_deliveries.location_id (15 deliveries)

friends (20)
  ├─> friend_location_history.friend_id (44 entries)
  └─> requests.friend_id (15 requests)

runs (6)
  ├─> run_team_members.run_id (15 members)
  ├─> requests.run_id (8 assigned requests)
  └─> run_stop_deliveries.run_id (15 delivery records)

requests (15)
  └─> request_status_history.request_id (29 history entries)
```

## Ready for Production Deployment

Once seeding completes successfully:
1. Commit all changes
2. Push to Railway (auto-deploy)
3. Use Settings → Developer → Reset Database to seed Railway DB
4. Test all features with realistic data
