# School/Locality/OSM Architecture Analysis

## Current State: The Frankenstein Problem

You're absolutely right - the codebase has multiple conflicting approaches to handling schools and localities, creating a confusing and unmaintainable mess.

---

## 🔴 CRITICAL ISSUES

### 1. **Three Different Locality Systems Fighting Each Other**

#### System A: Static Fallback Data (`irish-geographic-data.ts`)
- Hardcoded counties and localities with fake IDs like `'cork-city'`, `'dublin-county'`
- Used as "fallback" but actually used as primary in many places
- **Problem**: These IDs don't match database UUIDs, causing constant mismatches

#### System B: Database Localities (from `localities` table)
- Real localities with UUID primary keys
- Some have `osm_id` populated, some don't
- **Problem**: Incomplete data, not all localities from OSM are persisted

#### System C: On-Demand OSM Localities (from Overpass API)
- Fetched dynamically with IDs like `osm_765382428`
- Never persisted to database (until my recent "fix")
- **Problem**: Temporary, lost on refresh, causes lag

### 2. **The Locality Search Lag Issue**

**Why it's lagging:**

```typescript
// In school-setup-request-dialog.tsx line 137-196
const { data: searchedLocalities } = useQuery<OSMLocality[]>({
  queryKey: ['localities-search', selectedCounty, debouncedLocalitySearchTerm],
  queryFn: async () => {
    // 1. First loads static localities from irish-geographic-data.ts
    let localities = (staticLocalities || [])
      .filter(locality => ...)
      .slice(0, 10)
      .map(locality => ({...}));

    // 2. THEN makes an API call to Overpass
    if (debouncedLocalitySearchTerm && debouncedLocalitySearchTerm.trim().length >= 2) {
      const response = await fetch(`/api/spipuniform/localities/search?${params}`);
      // 3. Overpass API call takes 2-5 seconds
      // 4. User sees lag while waiting
    }

    return localities;
  },
  enabled: !!selectedCounty
});
```

**The lag happens because:**
1. Static localities load first (fast)
2. Then it waits for OSM API (2-5 seconds)
3. UI blocks waiting for the query to complete
4. OSM Overpass API is slow and rate-limited

### 3. **School Creation Workflow is Broken**

There are **FOUR** different ways schools are created, all incompatible:

#### Path 1: CSV Import (`scripts/import-schools.ts`)
- Imports schools from CSV files
- Sets `isActive: false` by default
- Tries to match localities by name from CSV address
- **Problem**: Locality matching is fuzzy and often fails

#### Path 2: School Setup Request (marketplace flow)
- User selects OSM locality
- Creates `school_setup_requests` record
- Admin approves → activates existing CSV school OR creates new school
- **Problem**: OSM localities aren't in database, so foreign key fails

#### Path 3: Manual School Creation (`school-creation-dialog.tsx`)
- Admin creates school manually
- Uses OSM locality search
- **Problem**: Same OSM locality issue

#### Path 4: School Submission (`school-submissions.ts`)
- Public form for submitting schools
- Different schema, different workflow
- **Problem**: Disconnected from other systems

### 4. **The "Static Localities" Confusion**

The `irish-geographic-data.ts` file is supposed to be a "fallback" but:
- It's used as the PRIMARY source in many components
- The IDs don't match database IDs
- It only has ~200 localities, while OSM has thousands
- Components try to "enhance" it with OSM data, creating a hybrid mess

Example from `school-setup-request-dialog.tsx` line 210-216:
```typescript
// For locality filtering, use the locality name directly from static data
const { getLocalityById } = await import('@/data/irish-geographic-data');
const staticLocalityData = getLocalityById(selectedLocality);

if (staticLocalityData) {
  params.set('osmLocalityName', staticLocalityData.name);
  params.set('marketplace', 'true');
}
```

**This is insane**: It's looking up a locality by ID in static data, then passing the NAME to the API, which then does a fuzzy match on school addresses!

---

## 🎯 ROOT CAUSE

**The fundamental problem**: The app was designed to use OSM as the source of truth for localities, but:
1. OSM data was never properly persisted to the database
2. A "fallback" static data system was added as a band-aid
3. Now both systems exist simultaneously, fighting each other
4. School filtering uses address string matching instead of proper foreign keys

---

## ✅ PROPER ARCHITECTURE (How It Should Work)

### Phase 1: Database as Single Source of Truth

```
┌─────────────────────────────────────────────────────────────┐
│                     SINGLE SOURCE OF TRUTH                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database                        │ │
│  │                                                         │ │
│  │  counties (26 rows)                                    │ │
│  │    ├─ id (UUID)                                        │ │
│  │    ├─ name                                             │ │
│  │    └─ osm_id                                           │ │
│  │                                                         │ │
│  │  localities (~5000 rows from OSM)                     │ │
│  │    ├─ id (UUID)                                        │ │
│  │    ├─ name                                             │ │
│  │    ├─ county_id (FK)                                   │ │
│  │    ├─ osm_id (from Overpass)                          │ │
│  │    ├─ centre_lat                                       │ │
│  │    └─ centre_lng                                       │ │
│  │                                                         │ │
│  │  schools                                               │ │
│  │    ├─ id (UUID)                                        │ │
│  │    ├─ name                                             │ │
│  │    ├─ address                                          │ │
│  │    ├─ locality_id (FK to localities) ← PROPER FK!     │ │
│  │    ├─ county_id (FK to counties)                      │ │
│  │    ├─ is_active (boolean)                             │ │
│  │    └─ csv_source_row (jsonb, nullable)                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: One-Time OSM Population

```bash
# Run ONCE to populate all localities from OSM
pnpm tsx scripts/populate-localities-osm.ts

# This script:
# 1. Fetches all towns/villages from OSM for each county
# 2. Inserts them into localities table with osm_id
# 3. Takes ~30 minutes, but only needs to run once
# 4. Can be re-run periodically to update
```

### Phase 3: Simplified School Workflow

```
User Flow:
1. Select County (from database)
   └─> Fast query: SELECT * FROM counties ORDER BY name

2. Select Locality (from database)
   └─> Fast query: SELECT * FROM localities WHERE county_id = ? ORDER BY name
   └─> No OSM API call needed!
   └─> Instant results, no lag

3. Select School (from database)
   └─> Fast query: SELECT * FROM schools 
       WHERE county_id = ? AND locality_id = ? AND is_active = true

4. If school not found:
   └─> Create school_setup_request with proper locality_id (UUID)
   └─> Admin approves → school.is_active = true
```

### Phase 4: Remove All Band-Aids

**Delete/Deprecate:**
- ❌ `src/data/irish-geographic-data.ts` (static fallback data)
- ❌ `src/routes/api/localities/persist.ts` (my band-aid)
- ❌ `ensureLocalityExists()` function (my band-aid)
- ❌ All OSM API calls from UI components
- ❌ Hybrid static+OSM locality search logic

**Keep:**
- ✅ `src/lib/overpass.ts` (for one-time population script)
- ✅ `scripts/populate-localities-osm.ts` (run periodically)
- ✅ Database queries only

---

## 📋 IMPLEMENTATION PLAN

### Step 1: Populate Database with OSM Localities (30 min)

```bash
# This will fetch ~5000 localities from OSM and insert into database
pnpm tsx scripts/populate-localities-osm.ts
```

### Step 2: Update School CSV Import to Use Database Localities

```typescript
// In scripts/import-schools.ts
// Instead of fuzzy matching, do proper database lookup:

const locality = await db
  .select()
  .from(localities)
  .where(
    and(
      eq(localities.countyId, countyId),
      // Use fuzzy matching on name from address
      sql`LOWER(${localities.name}) = LOWER(${extractedLocalityName})`
    )
  )
  .limit(1);

const schoolData = {
  name: row['Official Name'],
  address: fullAddress,
  localityId: locality[0]?.id || null, // Proper UUID or null
  countyId: countyId,
  level: 'primary',
  isActive: false // Requires activation
};
```

### Step 3: Simplify Locality Selection in UI

```typescript
// In school-setup-request-dialog.tsx
// REMOVE all OSM API calls, use database only:

const { data: localities } = useQuery({
  queryKey: ['localities', selectedCounty, localitySearchTerm],
  queryFn: async () => {
    const params = new URLSearchParams({
      countyId: selectedCounty,
      search: localitySearchTerm || ''
    });
    
    // Simple database query, returns instantly
    const response = await fetch(`/api/localities?${params}`);
    const data = await response.json();
    return data.localities;
  },
  enabled: !!selectedCounty
});
```

### Step 4: Create Simple Localities API

```typescript
// src/routes/api/localities/index.ts
export const ServerRoute = createServerFileRoute('/api/localities').methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const countyId = url.searchParams.get('countyId');
    const search = url.searchParams.get('search') || '';

    const localities = await db
      .select()
      .from(localities)
      .where(
        and(
          eq(localities.countyId, countyId),
          search ? ilike(localities.name, `%${search}%`) : undefined
        )
      )
      .orderBy(asc(localities.name))
      .limit(100);

    return new Response(JSON.stringify({
      success: true,
      localities
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

### Step 5: Update School Filtering

```typescript
// In /api/schools endpoint
// REMOVE address string matching, use proper foreign keys:

const schools = await db
  .select()
  .from(schools)
  .where(
    and(
      eq(schools.countyId, countyId),
      localityId ? eq(schools.localityId, localityId) : undefined,
      eq(schools.isActive, true)
    )
  )
  .orderBy(asc(schools.name));
```

### Step 6: Clean Up School Setup Requests

```typescript
// school_setup_requests table already has proper schema:
// - locality_id UUID NOT NULL (FK to localities)

// Just remove all the OSM ID handling:
const [newRequest] = await db
  .insert(schoolSetupRequests)
  .values({
    userId,
    countyId: validatedData.countyId,
    localityId: validatedData.localityId, // Already a UUID from database
    schoolType: validatedData.schoolType,
    selectedSchoolId: validatedData.selectedSchoolId || null,
    customSchoolName: validatedData.customSchoolName || null,
    status: 'pending',
  })
  .returning();
```

---

## 🚀 BENEFITS

### Before (Current Frankenstein):
- ❌ 3 different locality systems
- ❌ 2-5 second lag on locality search
- ❌ OSM API rate limiting issues
- ❌ Localities lost on refresh
- ❌ Foreign key violations
- ❌ Address string matching (unreliable)
- ❌ 500+ lines of band-aid code

### After (Clean Architecture):
- ✅ 1 source of truth (database)
- ✅ Instant locality search (<50ms)
- ✅ No external API calls in UI
- ✅ Proper foreign key relationships
- ✅ Reliable school filtering
- ✅ Simple, maintainable code
- ✅ Scalable to 10,000+ localities

---

## ⚠️ MIGRATION NOTES

1. **Existing schools with null locality_id**: Need to be matched to localities
2. **Existing school_setup_requests**: May have invalid locality references
3. **Static locality IDs in URL params**: Will break, need migration

---

## 🔧 NEXT STEPS

1. Run `populate-localities-osm.ts` to fill database
2. Audit existing schools and match to localities
3. Remove all static locality code
4. Simplify UI components to use database only
5. Test end-to-end flow
6. Deploy

**Estimated Time**: 4-6 hours of focused work
**Impact**: Eliminates 90% of the complexity and all the lag issues

