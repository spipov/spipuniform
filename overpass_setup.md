# Overpass Setup Guide: County, Locality, and Place Configuration

This document details how the county-locality-place hierarchy is set up in the LocalTown Weather application. The system uses the Overpass API (from OpenStreetMap) to dynamically fetch geographic data for Ireland (counties, towns/localities, places) and persists customized place data in the PostgreSQL database via Drizzle ORM. There is no automated bulk import script; setup is done manually via the admin dashboard, leveraging Overpass for discovery and search. This allows reproduction on another install by following the steps below.

The hierarchy:
- **County**: Top-level administrative boundary (e.g., "Dublin", "Cork"). Fetched dynamically via Overpass for bounds and areas.
- **Locality/Town**: Mid-level settlements (cities, towns, villages, hamlets, suburbs) within a county, fetched via Overpass queries filtered by county area or bounding box.
- **Place**: Persistent DB entry for a locality/town, with custom attributes (e.g., coastal flag, featured images, Wikipedia details). Overpass provides base data (name, lat/lon, type); admin customizes and saves to DB.

All Overpass interactions are handled in [`src/lib/overpass.ts`](src/lib/overpass.ts), with caching (5-60 min TTL). API endpoints under `/api/places/` serve dynamic data, while admin endpoints `/api/admin/places/` manage DB persistence.

## Prerequisites for Reproduction
1. **Database Setup**:
   - Ensure PostgreSQL is running and configured in `.env` (e.g., `DATABASE_URL`).
   - Run Drizzle migrations to create the `places` table:
     ```
     npx drizzle-kit generate:pg
     npx drizzle-kit push:pg  # Or migrate via your preferred method
     ```
     The schema is in [`src/db/schema/places.ts`](src/db/schema/places.ts), defining fields like `name`, `county`, `slug`, `latitude`, `longitude`, `placeType`, `isCoastal`, `wikipediaUrl`, `population`, etc. Slug is auto-generated via `slugify` (lowercase, hyphenated name).

2. **App Setup**:
   - Install dependencies: `npm install`.
   - Start the dev server: `npm run dev`.
   - Access at `http://localhost:3000` (or your port).

3. **Admin Access**:
   - Default admin: Email `admin@admin.com` (or create via `/auth/signup`).
   - Log in at `/auth/signin`.
   - Navigate to `/dashboard/places` for management UI (uses TanStack Router; see [`src/routes/dashboard/places.tsx`](src/routes/dashboard/places.tsx) – note: this is a route file, rendering the admin component).

4. **Overpass API**:
   - No API key needed; uses public endpoint `https://overpass-api.de/api/interpreter`.
   - Queries timeout at 20-30s; includes fallbacks (area → bounding box).

## Step-by-Step Setup Process

### 1. County Configuration
Counties are not stored in DB; they are derived from URL params (e.g., `/dublin`) or Overpass queries. Overpass identifies Irish counties via `admin_level=6` (administrative boundaries).

- **Dynamic Fetching**:
  - Use `buildAreaQueryForCounty(countyName)` in [`overpass.ts`](src/lib/overpass.ts) to resolve county area (tries "County Dublin" and "Dublin").
  - `getCountyBounds(countyName)` fetches bounding box (min/max lat/lon) for fallback queries.
  - Example query snippet:
    ```
    area["boundary"="administrative"]["admin_level"~"6|7"]["name"="${countyName}"]->.a;
    area["boundary"="administrative"]["admin_level"~"6|7"]["name"="County ${countyName}"]->.b;
    (.a; .b;)->.county_area;
    ```
  - Test via API: `GET /api/places/towns?county=Dublin` (returns towns array).

- **Reproduction**:
  - Counties are implicit. For a new install, use Irish county names (lowercase, slugified) in URLs (e.g., `/cork`).
  - If needed, hardcode Irish counties in a frontend dropdown (not currently implemented; add to search UI if desired).
  - Verify bounds: Call `getCountyBounds("Dublin")` – expect ~53.2-53.5 lat, -6.6--6.0 lon.

### 2. Locality/Town Discovery (Overpass Fetching)
Localities (towns, villages, etc.) are fetched dynamically per county using Overpass QL. No DB storage for raw localities; fetched on-demand for search/autocomplete.

- **Fetching All Towns in County**:
  - Endpoint: `GET /api/places/towns?county=${countyName}` (validates county length 2-100).
  - Calls `fetchTownsForCounty(countyName)` in [`overpass.ts`](src/lib/overpass.ts).
  - Query: Filters `place~"^(city|town|village|hamlet|locality|suburb)$"`, plus `natural~(bay|beach)` and `tourism~(attraction|resort)` with names, within county area.
  - Output: `TownItem[]` (id, name, placeType, lat, lon). Deduped by name (case-insensitive), sorted alphabetically.
  - Fallback: If area query fails/empty, uses county bbox.
  - Cache: 5 min.

- **Searching Localities**:
  - Endpoint: `GET /api/places/search?county=${countyName}&q=${query}` (q min length 1).
  - Calls `searchPlacesInCounty(countyName, query)`.
  - Query: Case-insensitive `name~"${query}",i` on same place/natural/tourism tags within county.
  - First checks cached towns; falls back to bbox if needed.
  - Cache: 20-60s.

- **Reproduction**:
  - In admin UI (/dashboard/places), search for localities (integrates these APIs).
  - Manually test: Curl `curl "http://localhost:3000/api/places/towns?county=dublin"`.
  - Expected: ~100-200 items for Dublin (e.g., {"id":123456,"name":"Dublin","placeType":"city","lat":53.3498,"lon":-6.2603}).

### 3. Place Creation and Persistence (DB + Overpass Details)
Places are created/edited in the admin dashboard, using Overpass for base data (lat/lon, details) and DB for customizations.

- **Admin Management**:
  - UI: `/dashboard/places` (route in [`src/routes/dashboard/places.tsx`](src/routes/dashboard/places.tsx); renders table/form for CRUD).
  - List: `GET /api/admin/places` (admin-only; returns all places, sorted by createdAt desc).
  - Create: `POST /api/admin/places` with JSON body matching [`createPlaceSchema`](src/routes/api/admin/places.ts) (name, county required; auto-slugify).
    - Validates admin role/email.
    - Checks slug uniqueness.
    - Inserts via Drizzle; returns created place.
  - Update: `PATCH /api/admin/places/${placeId}` (partial updates; prevents empty slug).
  - Delete: `DELETE /api/admin/places/${placeId}` (204 on success).

- **Integrating Overpass for Place Details**:
  - When adding: Use search/towns APIs to find lat/lon, name.
  - Fetch extras: `getPlaceDetails(placeName, lat, lon)` in [`overpass.ts`](src/lib/overpass.ts).
    - Query: Searches around 1km radius for name match; extracts population, wikipediaUrl, description, tags (place, tourism, etc.).
    - Cache: 30 min.
    - Example: For "Dublin", 53.3498, -6.2603 → {"population":557000, "wikipediaUrl":"https://en.wikipedia.org/wiki/Dublin", "tags":["city"]}.
  - Save to DB: Set `isCoastal` (manual flag for marine/tides), `featuredImage`, `wikipediaUrl`, etc.
  - Endpoint for frontend: `GET /api/frontend/place/${slug}` (fetches DB place for custom fields like images; fallback title from slug).

- **Place Page Rendering**:
  - Route: `/$county/$town` (e.g., `/dublin/dublin`; see [`src/routes/$county.$town.tsx`](src/routes/$county.$town.tsx)).
  - Fetches DB place via `/api/frontend/place/${town}` for custom data (hero image, attribution).
  - Uses lat/lon for weather/marine/tides cards (from DB or Overpass if not persisted).
  - Slugify/titleCase utils for URL/name handling.

- **Reproduction Steps for a New Install**:
  1. Log in as admin → Go to `/dashboard/places`.
  2. **Add County Towns**:
     - For each county (e.g., "Dublin"):
       - Use search form (q= partial name) or load all via towns API.
       - Select a locality (e.g., "Howth"): Auto-populates name, lat/lon from Overpass.
       - Fetch details: Manually or via UI call to getPlaceDetails (population, wiki, tags).
       - Set custom: `county="Dublin"`, `placeType="village"`, `isCoastal=true` (if applicable), add image attribution.
       - Save: POST creates DB entry with slug="howth".
  3. **Bulk Setup Tip**: For efficiency, script a one-time admin script (not present; add via `npm run setup-places`):
     - Loop Irish counties (list: Carlow, Cavan, Clare, ...).
     - Fetch towns via `fetchTownsForCounty`.
     - For top N (e.g., 50) per county, create minimal DB place (name, county, lat/lon, slug).
     - Example pseudocode:
       ```ts
       const counties = ["dublin", "cork", ...];
       for (const county of counties) {
         const towns = await fetchTownsForCounty(county);
         for (const town of towns.slice(0, 50)) {
           const details = await getPlaceDetails(town.name, town.lat, town.lon);
           await db.insert(places).values({
             name: town.name,
             county,
             slug: slugify(town.name),
             latitude: town.lat,
             longitude: town.lon,
             placeType: town.placeType,
             population: details.population,
             wikipediaUrl: details.wikipediaUrl,
             // Add coastal logic if needed (e.g., check tags or lon < -6)
           });
         }
       }
       ```
     - Run in a Node script or admin console.
  4. **Verify**:
     - Check DB: `SELECT * FROM places WHERE county='dublin';`.
     - Test page: Visit `/dublin/howth` – should render with weather cards using place lat/lon.
     - Coastal places: Set `isCoastal=true` to enable marine/tides cards.
  5. **Customization**:
     - Add featured images: Upload via admin (stores in `featuredImage`, attribution in JSONB).
     - Tags: Comma-separated (e.g., "coastal,village"); used for SEO/filtering.
     - If Overpass misses data: Manually edit lat/lon (e.g., from Google Maps).

## Common Issues & Troubleshooting
- **No Towns Returned**: Check county name spelling (e.g., "County Dublin" vs "Dublin"). Test Overpass directly at overpass-turbo.eu.
- **Slug Conflicts**: Auto-slugify handles basics; edit if duplicate (e.g., "new-ross" → "new-ross-2").
- **Coastal Detection**: Manual; use Overpass tags (natural=coastline) or lon < -6.5 for west coast.
- **Performance**: Overpass caching prevents overload; for production, consider pre-populating DB with all major places (~2000 Irish towns).
- **Ireland Focus**: Queries are global but filtered by county bbox (Irish coords ~51.5-55.5 lat, -10.5--6 lon).
- **Details Endpoint**: `/api/places/details` is stubbed (501); implement if needed for UI auto-fill.

This setup ensures dynamic scalability while allowing admin customization. For bulk import, extend with a setup script as suggested.