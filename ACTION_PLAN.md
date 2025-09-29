# Action Plan: Fix School/Locality Architecture

## Summary

The current system has 3 conflicting locality sources (static data, database, OSM API) causing lag, complexity, and bugs. This plan consolidates everything into a single database-driven approach.

---

## 🎯 Goals

1. **Eliminate lag** in locality search (currently 2-5 seconds → target <50ms)
2. **Single source of truth** for localities (database only)
3. **Proper foreign key relationships** (no more string matching)
4. **Remove all band-aid code** (~500 lines of complexity)
5. **Maintainable, scalable architecture**

---

## 📋 Step-by-Step Plan

### ✅ Step 1: Populate Database with OSM Localities (30 minutes)

**Action**: Run the existing population script to fill the database with all localities from OSM.

```bash
# This will fetch ~5000 localities from OSM and insert into database
pnpm tsx scripts/populate-localities-osm.ts
```

**What it does**:
- Fetches all towns/villages/localities from OSM Overpass API for each county
- Inserts them into `localities` table with `osm_id`, `centre_lat`, `centre_lng`
- Avoids duplicates by checking existing names
- Takes ~30 minutes due to OSM API rate limiting (1 second delay between counties)

**Expected Result**:
- `localities` table will have ~5000 rows (currently has ~50)
- Each locality will have proper `osm_id` for reference
- All future queries will be instant database lookups

**Verification**:
```sql
-- Check locality counts per county
SELECT c.name, COUNT(l.id) as locality_count
FROM counties c
LEFT JOIN localities l ON l.county_id = c.id
GROUP BY c.name
ORDER BY c.name;

-- Should see hundreds of localities per county
```

---

### ✅ Step 2: Create Simple Localities API (15 minutes)

**Action**: Create a new API endpoint that queries the database directly (no OSM calls).

**File**: `src/routes/api/localities/index.ts`

```typescript
import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { localities, counties } from '@/db/schema';
import { eq, and, ilike, asc } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/localities').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const countyId = url.searchParams.get('countyId');
      const search = url.searchParams.get('search') || '';
      const limit = parseInt(url.searchParams.get('limit') || '100');

      if (!countyId) {
        return new Response(
          JSON.stringify({ success: false, error: 'County ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const conditions = [eq(localities.countyId, countyId)];
      if (search) {
        conditions.push(ilike(localities.name, `%${search}%`));
      }

      const results = await db
        .select({
          id: localities.id,
          name: localities.name,
          countyId: localities.countyId,
          osmId: localities.osmId,
          centreLat: localities.centreLat,
          centreLng: localities.centreLng
        })
        .from(localities)
        .where(and(...conditions))
        .orderBy(asc(localities.name))
        .limit(limit);

      return new Response(JSON.stringify({
        success: true,
        localities: results,
        total: results.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching localities:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch localities'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
```

**Expected Result**:
- `/api/localities?countyId=xxx` returns all localities for a county instantly
- `/api/localities?countyId=xxx&search=grey` returns filtered results
- Response time: <50ms (database query only)

---

### ✅ Step 3: Update School Setup Request Dialog (30 minutes)

**Action**: Remove all OSM API calls and static data, use database API only.

**File**: `src/components/marketplace/school-setup-request-dialog.tsx`

**Changes**:
1. Remove `staticLocalities` query (lines 126-134)
2. Remove OSM API call from `searchedLocalities` query (lines 158-190)
3. Simplify to single database query

```typescript
// REPLACE lines 126-196 with:

// Fetch localities from database only
const { data: localities, isLoading: localitiesLoading } = useQuery({
  queryKey: ['localities', selectedCounty, debouncedLocalitySearchTerm],
  queryFn: async () => {
    if (!selectedCounty) return [];

    const params = new URLSearchParams({
      countyId: selectedCounty,
      limit: '100'
    });

    if (debouncedLocalitySearchTerm) {
      params.set('search', debouncedLocalitySearchTerm);
    }

    const response = await fetch(`/api/localities?${params}`);
    if (!response.ok) throw new Error('Failed to fetch localities');
    const data = await response.json();
    return data.localities || [];
  },
  enabled: !!selectedCounty,
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
});
```

**Also update**:
- Remove `localityName` from request data (line 308) - not needed anymore
- Update `handleSubmitRequest` to use locality ID directly (it's already a UUID)

```typescript
const handleSubmitRequest = () => {
  const requestData = {
    countyId: selectedCounty,
    localityId: selectedLocality, // Already a UUID from database
    schoolType,
    selectedSchoolId: selectedSchool || null,
    customSchoolName: customSchoolName.trim() || null,
  };

  createSchoolSetupRequestMutation.mutate(requestData);
};
```

**Expected Result**:
- Locality dropdown loads instantly (<50ms)
- No lag when typing in search
- No OSM API calls from UI
- Proper UUIDs used throughout

---

### ✅ Step 4: Simplify School Setup Request API (20 minutes)

**Action**: Remove all OSM locality handling code.

**File**: `src/routes/api/school-setup-requests.ts`

**Changes**:
1. Remove `ensureLocalityExists()` function (lines 30-111)
2. Remove `localityName` from validation schema (line 15)
3. Simplify POST method to use locality ID directly

```typescript
// REMOVE lines 30-111 (ensureLocalityExists function)

// UPDATE validation schema (line 10-27):
const schoolSetupRequestSchema = z.object({
  countyId: z.string().uuid(),
  localityId: z.string().uuid(), // Must be UUID (from database)
  schoolType: z.enum(['primary', 'secondary']),
  selectedSchoolId: z.union([z.string().uuid(), z.null()]).optional(),
  customSchoolName: z.union([z.string(), z.null()]).optional(),
}).refine(
  (data) => {
    return (data.selectedSchoolId && data.selectedSchoolId.trim() !== '') ||
           (data.customSchoolName && data.customSchoolName.trim() !== '');
  },
  {
    message: "Either selectedSchoolId or customSchoolName must be provided",
    path: ["selectedSchoolId"],
  }
);

// UPDATE POST method (remove lines 215-243):
// Just use validatedData.localityId directly - it's already a UUID

const [newRequest] = await db
  .insert(schoolSetupRequests)
  .values({
    userId,
    countyId: validatedData.countyId,
    localityId: validatedData.localityId, // Already a UUID
    schoolType: validatedData.schoolType,
    selectedSchoolId: validatedData.selectedSchoolId || null,
    customSchoolName: validatedData.customSchoolName || null,
    status: 'pending',
  })
  .returning();
```

**Expected Result**:
- ~100 lines of code removed
- No more OSM ID handling
- Proper foreign key relationships
- Simpler, more maintainable code

---

### ✅ Step 5: Update Browse Page (15 minutes)

**Action**: Update school filtering to use database localities.

**File**: `src/routes/marketplace/browse.tsx`

**Changes**:
- Update schools query (lines 120-128) to fetch with locality info
- Ensure school dropdown shows locality names properly

The `/api/schools` endpoint already returns `localityName` and `countyName`, so this should already work. Just verify it's using the database localities.

---

### ✅ Step 6: Remove Deprecated Files (10 minutes)

**Action**: Delete or deprecate files that are no longer needed.

**Files to remove/deprecate**:
1. `src/routes/api/localities/persist.ts` - Band-aid for OSM persistence
2. `src/routes/api/spipuniform/localities/search.ts` - OSM search endpoint
3. `src/routes/api/localities/fetch/$.ts` - OSM fetch endpoint
4. `src/data/irish-geographic-data.ts` - Static fallback data (or mark as deprecated)

**Note**: Keep `src/lib/overpass.ts` for the population script.

---

### ✅ Step 7: Update Other Components (30 minutes)

**Action**: Update any other components that use locality search.

**Files to check**:
1. `src/components/marketplace/hierarchical-marketplace-flow.tsx` - Same changes as school-setup-request-dialog
2. `src/components/school-creation-dialog.tsx` - Same changes
3. Any other components using `irish-geographic-data.ts`

---

### ✅ Step 8: Test End-to-End (30 minutes)

**Test Cases**:
1. ✅ Browse marketplace → select school filter → verify instant loading
2. ✅ School setup request → select county → select locality → verify instant loading
3. ✅ School setup request → search for locality → verify instant filtering
4. ✅ Submit school setup request → verify it saves to database
5. ✅ Admin approve request → verify school is activated
6. ✅ Browse marketplace → verify activated school appears

---

## 📊 Expected Outcomes

### Performance
- **Before**: 2-5 seconds to load localities (OSM API call)
- **After**: <50ms to load localities (database query)
- **Improvement**: 40-100x faster

### Code Complexity
- **Before**: ~500 lines of OSM handling, static data, band-aids
- **After**: ~100 lines of simple database queries
- **Reduction**: 80% less code

### Maintainability
- **Before**: 3 conflicting systems, hard to debug
- **After**: 1 system, easy to understand
- **Improvement**: Significantly more maintainable

### Reliability
- **Before**: OSM API failures, rate limiting, timeouts
- **After**: Database queries, always available
- **Improvement**: 99.9% uptime

---

## ⚠️ Risks & Mitigation

### Risk 1: OSM Population Script Fails
**Mitigation**: Script has error handling per county. If one county fails, others continue. Can re-run script to fill gaps.

### Risk 2: Existing Data Inconsistencies
**Mitigation**: Run audit queries before and after to identify issues. Fix manually if needed.

### Risk 3: Breaking Changes for Users
**Mitigation**: Locality IDs will change from static IDs to UUIDs. Clear any cached data. URL params with old IDs will need to be handled gracefully.

---

## 🚀 Deployment Checklist

- [ ] Run `populate-localities-osm.ts` on production database
- [ ] Verify locality counts per county
- [ ] Deploy new API endpoints
- [ ] Deploy updated UI components
- [ ] Remove deprecated files
- [ ] Clear client-side caches
- [ ] Monitor error logs for issues
- [ ] Test critical user flows

---

## 📝 Notes

- The population script can be re-run periodically (e.g., monthly) to update localities from OSM
- Consider adding a cron job to refresh localities automatically
- Monitor database size - 5000 localities is manageable, but could grow
- Consider adding indexes on `localities.name` for faster search

---

## ⏱️ Time Estimate

- Step 1: 30 minutes (mostly waiting for OSM API)
- Step 2: 15 minutes
- Step 3: 30 minutes
- Step 4: 20 minutes
- Step 5: 15 minutes
- Step 6: 10 minutes
- Step 7: 30 minutes
- Step 8: 30 minutes

**Total**: ~3 hours of active work + 30 minutes of waiting

---

## 🎉 Success Criteria

1. ✅ Locality search loads in <50ms
2. ✅ No OSM API calls from UI components
3. ✅ All school setup requests save successfully
4. ✅ Browse page school filter works instantly
5. ✅ Code is simpler and more maintainable
6. ✅ No lag or timeouts in user experience

