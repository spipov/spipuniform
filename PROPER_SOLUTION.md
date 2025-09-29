# Proper Solution: OSM Search Done Right

## The Right Approach

**You're correct** - we should NOT store 5000+ localities. That's overkill.

**The real insight**: 
- We have 3808 schools from CSV imports
- Schools have addresses with locality names in them
- We only need localities that have actual schools
- OSM search should be fast and work consistently

---

## Current State

- **42 localities** in database (manually added)
- **3808 schools** total (from CSV)
- **2 active schools** (manually activated)
- **Schools have addresses** with locality names embedded

---

## The Proper Architecture

### 1. **Schools are the Source of Truth**

Schools already have addresses like:
- "Greystones CNS, Charlesland, Greystones"
- "Neillstown Road, Clondalkin, Dublin 22"

The locality name is IN the address. We don't need a separate localities table for filtering.

### 2. **OSM Search for User Selection Only**

When users search for localities:
- Query OSM Overpass API directly (as we do now)
- Cache results aggressively (5-10 minutes)
- Use debouncing (already implemented)
- Return results fast

### 3. **School Filtering by Address String Match**

When filtering schools by locality:
- Use `ILIKE` on school address field
- Match locality name from OSM search
- Fast database query, no foreign keys needed

### 4. **Minimal Database Storage**

Only store localities that:
- Have been explicitly created by admins
- Are needed for specific schools
- Are frequently searched

---

## Why This Works

1. **No bloat**: Database stays small (42 localities vs 5000+)
2. **Flexible**: Works with any locality name from OSM
3. **Fast**: Address string matching is fast with proper indexes
4. **Simple**: One clear pattern throughout the app
5. **Scalable**: As schools are added, it just works

---

## The ONE Way to Do Things

### Pattern: OSM Search → Address Match

```typescript
// 1. User searches for locality
const osmLocalities = await searchOSM(countyName, searchTerm);

// 2. User selects locality
const selectedLocality = osmLocalities.find(l => l.id === selectedId);

// 3. Filter schools by address match
const schools = await db
  .select()
  .from(schools)
  .where(
    and(
      eq(schools.countyId, countyId),
      ilike(schools.address, `%${selectedLocality.name}%`),
      eq(schools.isActive, true)
    )
  );
```

---

## Implementation Plan

### Step 1: Optimize OSM Search API (30 min)

**File**: `src/routes/api/localities/search.ts` (NEW - consolidate all OSM search)

```typescript
import { createServerFileRoute } from '@tanstack/react-start/server';
import { searchPlacesInCounty, fetchTownsForCounty } from '@/lib/overpass';
import { db } from '@/db';
import { counties } from '@/db/schema';
import { eq } from 'drizzle-orm';

// In-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttlMinutes: number) {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMinutes * 60 * 1000
  });
}

export const ServerRoute = createServerFileRoute('/api/localities/search').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const countyId = url.searchParams.get('countyId');
      const search = url.searchParams.get('search') || '';

      if (!countyId) {
        return new Response(
          JSON.stringify({ success: false, error: 'County ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get county name
      const county = await db
        .select({ name: counties.name })
        .from(counties)
        .where(eq(counties.id, countyId))
        .limit(1);

      if (!county.length) {
        return new Response(
          JSON.stringify({ success: false, error: 'County not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const countyName = county[0].name.toLowerCase();
      const cacheKey = `osm:${countyName}:${search}`;

      // Check cache first
      const cached = getCached(cacheKey);
      if (cached) {
        return new Response(JSON.stringify({
          success: true,
          localities: cached,
          cached: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Fetch from OSM
      let localities = [];
      if (search && search.trim().length >= 2) {
        localities = await searchPlacesInCounty(countyName, search.trim()) || [];
      } else {
        // For initial load, return top 20 most common localities
        localities = await fetchTownsForCounty(countyName) || [];
        localities = localities.slice(0, 20); // Limit to top 20
      }

      // Format results
      const formatted = localities.map(loc => ({
        id: `osm_${loc.id}`,
        name: loc.name,
        displayName: loc.name,
        placeType: loc.placeType,
        lat: loc.lat,
        lon: loc.lon
      }));

      // Cache for 10 minutes
      setCache(cacheKey, formatted, 10);

      return new Response(JSON.stringify({
        success: true,
        localities: formatted,
        cached: false
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error searching localities:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to search localities',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
```

**Key improvements**:
- Aggressive caching (10 minutes)
- Limit initial results to top 20 (not 1000+)
- Single consolidated endpoint
- Fast cache lookups

---

### Step 2: Update School Filtering API (20 min)

**File**: `src/routes/api/schools.ts`

**Change**: Use address string matching instead of locality foreign key

```typescript
// FIND this section (around line 50-80):
let conditions = [eq(schools.isActive, true)];

// ADD locality filtering by address match:
if (osmLocalityName) {
  conditions.push(
    ilike(schools.address, `%${osmLocalityName}%`)
  );
}

// Keep county filtering:
if (countyId) {
  conditions.push(eq(schools.countyId, countyId));
}
```

**Add index for performance**:
```sql
-- Run this migration
CREATE INDEX IF NOT EXISTS schools_address_trgm_idx 
ON schools USING gin (address gin_trgm_ops);
```

---

### Step 3: Standardize Locality Search Component (45 min)

**Create**: `src/components/shared/locality-search.tsx` (NEW - single reusable component)

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface LocalitySearchProps {
  countyId: string;
  value: string;
  onChange: (localityId: string, localityName: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function LocalitySearch({
  countyId,
  value,
  onChange,
  label = 'Town/Locality',
  placeholder = 'Type to search localities...',
  disabled = false
}: LocalitySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch localities from OSM
  const { data: localities, isLoading } = useQuery({
    queryKey: ['localities-search', countyId, debouncedTerm],
    queryFn: async () => {
      if (!countyId) return [];

      const params = new URLSearchParams({
        countyId,
        search: debouncedTerm
      });

      const response = await fetch(`/api/localities/search?${params}`);
      if (!response.ok) throw new Error('Failed to fetch localities');
      const data = await response.json();
      return data.localities || [];
    },
    enabled: !!countyId,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const handleSelect = (locality: any) => {
    onChange(locality.id, locality.name);
    setSearchTerm(locality.name);
    setIsOpen(false);
  };

  return (
    <div className="locality-search">
      <Label htmlFor="locality-search">{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="locality-search"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="pl-10"
          disabled={disabled || !countyId}
        />
        {isOpen && countyId && (
          <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto mt-1">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Loading localities...
              </div>
            ) : localities && localities.length > 0 ? (
              localities.map((locality: any) => (
                <button
                  key={locality.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                  onClick={() => handleSelect(locality)}
                >
                  {locality.name}
                  {locality.placeType && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({locality.placeType})
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {searchTerm ? 'No localities found' : 'Start typing to search...'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Step 4: Replace All Locality Search Instances (60 min)

**Files to update** (use the new `LocalitySearch` component):

1. `src/components/marketplace/school-setup-request-dialog.tsx`
2. `src/components/marketplace/hierarchical-marketplace-flow.tsx`
3. `src/components/school-creation-dialog.tsx`
4. Any other components with locality search

**Pattern**:
```typescript
// REPLACE complex locality search logic with:
import { LocalitySearch } from '@/components/shared/locality-search';

// In component:
const [selectedLocalityId, setSelectedLocalityId] = useState('');
const [selectedLocalityName, setSelectedLocalityName] = useState('');

<LocalitySearch
  countyId={selectedCounty}
  value={selectedLocalityId}
  onChange={(id, name) => {
    setSelectedLocalityId(id);
    setSelectedLocalityName(name);
  }}
/>
```

---

### Step 5: Remove All Band-Aid Code (30 min)

**Delete these files**:
- `src/routes/api/localities/persist.ts`
- `src/routes/api/spipuniform/localities/search.ts` (replaced by new one)
- `src/routes/api/localities/fetch/$.ts`

**Remove from `school-setup-requests.ts`**:
- `ensureLocalityExists()` function
- All OSM ID handling
- `localityName` from schema

**Deprecate** (mark as legacy, don't delete yet):
- `src/data/irish-geographic-data.ts` - Keep for now as ultimate fallback

---

### Step 6: Update School Setup Request Flow (20 min)

**File**: `src/routes/api/school-setup-requests.ts`

**Key change**: Store locality NAME instead of trying to force a foreign key

```typescript
// Update schema:
const schoolSetupRequestSchema = z.object({
  countyId: z.string().uuid(),
  localityName: z.string().min(1), // Store the NAME, not ID
  schoolType: z.enum(['primary', 'secondary']),
  selectedSchoolId: z.union([z.string().uuid(), z.null()]).optional(),
  customSchoolName: z.union([z.string(), z.null()]).optional(),
});

// When creating school from request:
const [newSchool] = await db
  .insert(schools)
  .values({
    name: reqRow.customSchoolName,
    address: reqRow.localityName, // Use locality name in address
    countyId: reqRow.countyId,
    localityId: null, // No foreign key needed
    level: reqRow.schoolType,
    isActive: true,
  })
  .returning();
```

---

## Summary: The ONE Way

### For Locality Search:
1. User types in `LocalitySearch` component
2. Component queries `/api/localities/search` (OSM with caching)
3. User selects locality by name
4. Store locality NAME (not ID)

### For School Filtering:
1. Use locality NAME from search
2. Query schools with `ILIKE schools.address '%LocalityName%'`
3. Fast, flexible, works with any locality

### For School Creation:
1. Store locality name in address field
2. No foreign key to localities table
3. Filtering works automatically

---

## Benefits

✅ **No database bloat** - Keep 42 localities, not 5000+
✅ **Fast search** - Aggressive caching, debouncing
✅ **Simple** - One pattern everywhere
✅ **Flexible** - Works with any OSM locality
✅ **Maintainable** - Single reusable component
✅ **Scalable** - No foreign key constraints

---

## Time Estimate

- Step 1: 30 min (optimize OSM API)
- Step 2: 20 min (update school filtering)
- Step 3: 45 min (create reusable component)
- Step 4: 60 min (replace all instances)
- Step 5: 30 min (remove band-aids)
- Step 6: 20 min (update request flow)

**Total**: ~3.5 hours

