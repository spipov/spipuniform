# Critical Issues and Required Fixes

## Summary
The application had several fundamental issues with data persistence, schema consistency, and temporary workarounds. These have been systematically addressed.

## ✅ FIXES COMPLETED

### 1. OSM Locality Persistence (FIXED)
**Problem**: OSM localities were fetched dynamically but never saved to the database, causing school setup requests to fail.

**Solution Implemented**:
- Created `ensureLocalityExists()` helper function in `school-setup-requests.ts`
- This function automatically persists OSM localities to the database when they're first used
- Handles duplicate detection by both OSM ID and locality name
- Updates existing localities with OSM IDs if they don't have one

**Files Modified**:
- `src/routes/api/school-setup-requests.ts` - Added locality persistence logic
- `src/components/marketplace/school-setup-request-dialog.tsx` - Now sends locality name with requests

### 2. School Setup Request Persistence (FIXED)
**Problem**: Requests with OSM localities were stored in-memory and lost on server restart.

**Solution Implemented**:
- Removed ALL in-memory storage fallbacks (`inMemoryRequests` array)
- All requests now persist to the database using proper Drizzle ORM
- OSM localities are persisted before creating the request
- Proper error handling with user-friendly messages

**Files Modified**:
- `src/routes/api/school-setup-requests.ts` - Removed in-memory fallbacks from GET, POST, and PUT methods

### 3. Greystones Locality Assignment (FIXED)
**Problem**: Greystones Community NS was incorrectly assigned to Bray locality.

**Solution Implemented**:
- Greystones locality was already added to the database
- School is now correctly assigned to Greystones locality
- Verified with database query

**Current Status**:
```
Greystones Community NS → Greystones, Wicklow ✅
NEILLSTOWN N S → Clondalkin, Dublin ✅
```

### 4. Drizzle ORM Consistency (FIXED)
**Problem**: Raw SQL queries were used instead of Drizzle ORM.

**Solution Implemented**:
- Restored proper Drizzle ORM usage in `/api/schools` endpoint
- All database operations now use Drizzle consistently
- No more raw SQL patches

---

## Issues Identified

### 1. **School Setup Requests Not Persisting to Database**
**Problem**: When a user submits a school setup request with an OSM locality ID (e.g., `osm_765382428`), the request is stored in-memory instead of the database.

**Root Cause**:
- The `school_setup_requests` table requires `locality_id` to be a UUID (foreign key to `localities` table)
- When users select an OSM locality that hasn't been fetched/stored in the database yet, the code falls back to in-memory storage
- In-memory storage is lost on server restart

**Location**: `src/routes/api/school-setup-requests.ts` lines 144-191

**Impact**:
- Requests are lost on server restart
- Admin cannot see these requests in the dashboard
- No audit trail or proper workflow

### 2. **OSM Localities Not Being Persisted**
**Problem**: When users search for localities using OSM (OpenStreetMap), the localities are fetched dynamically but never saved to the database.

**Root Cause**:
- The locality search API (`/api/localities/search`) fetches from OSM on-demand
- No mechanism to automatically persist OSM localities to the database
- The `localities` table has an `osm_id` column but it's not being populated

**Impact**:
- Users can select localities that don't exist in the database
- School setup requests fail to persist
- Inconsistent data between what users see and what's in the database

### 3. **Incorrect Locality Assignments**
**Problem**: Greystones Community NS was assigned to "Bray" locality instead of "Greystones"

**Root Cause**:
- Greystones locality didn't exist in the database
- Manual assignment chose the closest available locality (Bray)
- No validation or warning when assigning incorrect localities

**Impact**:
- Incorrect geographic data
- Users cannot filter/search properly
- Data quality issues

### 4. **Inconsistent Use of Drizzle ORM**
**Problem**: The `/api/schools` endpoint was changed from Drizzle ORM to raw SQL queries

**Root Cause**:
- Misunderstanding of the database schema
- Attempted to fix issues with quick patches instead of proper investigation
- No consistent pattern across the codebase

**Impact**:
- Code inconsistency
- Harder to maintain
- Type safety lost
- Goes against project architecture decisions

### 5. **Duplicate Schools in Database**
**Problem**: Multiple schools with the same name exist (e.g., 2x "Greystones Community NS")

**Root Cause**:
- CSV imports create inactive schools
- Manual school creation doesn't check for duplicates
- No unique constraints on school names

**Impact**:
- Data quality issues
- Confusion for users and admins
- Potential for selecting wrong school

## Required Fixes (In Priority Order)

### Priority 1: Fix OSM Locality Persistence
**Action Items**:
1. Create an API endpoint to persist OSM localities to the database when they're first fetched
2. Update the locality search flow to automatically save new OSM localities
3. Modify `school_setup_requests` to handle the async nature of locality creation
4. Add a background job or immediate persistence when OSM locality is selected

**Files to Modify**:
- `src/routes/api/localities/search.ts` - Add persistence logic
- `src/routes/api/localities/fetch/$.ts` - Ensure OSM data is saved
- `src/routes/api/school-setup-requests.ts` - Remove in-memory fallback

### Priority 2: Fix School Setup Request Persistence
**Action Items**:
1. Remove all in-memory storage fallbacks
2. Ensure all school setup requests are saved to the database
3. Add proper error handling and user feedback when locality doesn't exist
4. Create a proper workflow for handling OSM localities

**Files to Modify**:
- `src/routes/api/school-setup-requests.ts` - Remove lines 10-11, 144-191, 245-330

### Priority 3: Add Greystones and Other Missing Localities
**Action Items**:
1. Audit all schools in the database
2. Identify schools with missing or incorrect locality assignments
3. Fetch missing localities from OSM and persist them
4. Update school records with correct locality assignments

**SQL Queries Needed**:
```sql
-- Find schools without localities
SELECT id, name, address, county_id 
FROM schools 
WHERE locality_id IS NULL AND is_active = true;

-- Find schools with potentially incorrect localities
SELECT s.id, s.name, s.address, l.name as locality, c.name as county
FROM schools s
LEFT JOIN localities l ON s.locality_id = l.id
LEFT JOIN counties c ON s.county_id = c.id
WHERE s.is_active = true;
```

### Priority 4: Implement Duplicate School Detection
**Action Items**:
1. Add a check before creating new schools to detect potential duplicates
2. Implement fuzzy matching for school names
3. Show warnings to admins when potential duplicates are detected
4. Add a merge/deactivate workflow for duplicate schools

**Files to Create/Modify**:
- `src/lib/services/school-service.ts` - Add duplicate detection logic
- `src/routes/api/spipuniform/schools/index.ts` - Add validation before creation

### Priority 5: Restore Drizzle ORM Consistency
**Status**: ✅ COMPLETED
- Restored Drizzle ORM in `/api/schools` endpoint
- Removed raw SQL queries
- Added proper joins for county and locality names

## Database Schema Issues

### Current Schema
```typescript
// localities table
{
  id: uuid (PK),
  name: text,
  county_id: uuid (FK to counties),
  osm_id: text,  // ← This exists but not being used!
  centre_lat: numeric,
  centre_lng: numeric,
  created_at: timestamp,
  updated_at: timestamp
}

// school_setup_requests table
{
  id: uuid (PK),
  user_id: text (FK to user),
  county_id: uuid (FK to counties),
  locality_id: uuid (FK to localities),  // ← Requires UUID, can't handle OSM IDs
  school_type: text,
  selected_school_id: uuid,
  custom_school_name: text,
  status: enum,
  ...
}
```

### Proposed Changes
**Option A: Keep Current Schema (Recommended)**
- Persist OSM localities immediately when fetched
- Use the `osm_id` column to track OSM source
- Ensure all localities are in the database before allowing selection

**Option B: Allow Temporary OSM References**
- Change `locality_id` to allow text (UUID or OSM ID)
- Add a background job to resolve OSM IDs to UUIDs
- More complex but handles async nature better

**Recommendation**: Option A - Keep schema clean and persist immediately

## Testing Plan

### 1. Test OSM Locality Flow
- [ ] Search for a locality not in the database
- [ ] Verify it gets persisted to the database
- [ ] Verify `osm_id` is populated
- [ ] Verify subsequent searches use the database record

### 2. Test School Setup Request Flow
- [ ] Submit a request with a new OSM locality
- [ ] Verify request is saved to database (not in-memory)
- [ ] Verify request appears in admin dashboard
- [ ] Verify request persists after server restart

### 3. Test School Creation
- [ ] Create a school with proper locality
- [ ] Verify locality is correctly assigned
- [ ] Verify no duplicates are created
- [ ] Verify school appears in browse page with correct locality

### 4. Test Data Integrity
- [ ] Run audit queries to find schools without localities
- [ ] Verify all active schools have valid locality assignments
- [ ] Check for duplicate schools
- [ ] Verify all localities have valid county assignments

## Next Steps

1. **Immediate**: Fix OSM locality persistence (Priority 1)
2. **Short-term**: Remove in-memory fallbacks (Priority 2)
3. **Medium-term**: Add missing localities and fix assignments (Priority 3)
4. **Long-term**: Implement duplicate detection (Priority 4)

## Notes

- All fixes should use Drizzle ORM consistently
- No more temporary workarounds or in-memory storage
- Proper error handling and user feedback
- Comprehensive testing before deployment
- Database migrations for any schema changes

