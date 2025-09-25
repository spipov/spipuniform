import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { schools, localities, counties } from '@/db/schema';
import { eq, and, isNull, like, or } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/schools/').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const countyId = url.searchParams.get('countyId');
      const localityId = url.searchParams.get('localityId');
      const level = url.searchParams.get('level');
      const noLocality = url.searchParams.get('noLocality') === 'true';
      const search = url.searchParams.get('q'); // Search query
      const osmLocalityName = url.searchParams.get('osmLocalityName'); // OSM locality name for filtering

      let query = db
        .select({
          id: schools.id,
          name: schools.name,
          address: schools.address,
          level: schools.level,
          website: schools.website,
          phone: schools.phone,
          email: schools.email,
          localityName: localities.name,
          countyName: counties.name
        })
        .from(schools)
        .leftJoin(localities, eq(schools.localityId, localities.id))
        .leftJoin(counties, eq(schools.countyId, counties.id));

      // Build WHERE conditions
      const conditions: any[] = [eq(schools.isActive, true)];

      if (countyId) {
        conditions.push(eq(schools.countyId, countyId));
      }

      if (localityId) {
        conditions.push(eq(schools.localityId, localityId));
      } else if (countyId && noLocality) {
        // Get schools in county that have no locality
        conditions.push(isNull(schools.localityId));
      }

      if (level) {
        conditions.push(eq(schools.level, level as 'primary' | 'secondary'));
      }

      if (search && search.trim().length > 0) {
        conditions.push(
          or(
            like(schools.name, `%${search.trim()}%`),
            like(schools.address, `%${search.trim()}%`)
          )
        );
      }

      // If OSM locality is selected, filter schools by address containing locality name
      if (osmLocalityName && osmLocalityName.trim().length > 0) {
        conditions.push(
          like(schools.address, `%${osmLocalityName.trim()}%`)
        );
      }

      const result = await query
        .where(and(...conditions))
        .orderBy(schools.name);

      // If OSM locality filtering returned very few results, also include broader results
      if (osmLocalityName && result.length <= 1) {
        console.log(`Only ${result.length} schools found for locality '${osmLocalityName}', including broader county results`);
        
        // Get broader county results as fallback
        const fallbackConditions = [eq(schools.isActive, true)];
        
        if (countyId) {
          fallbackConditions.push(eq(schools.countyId, countyId));
        }
        if (level) {
          fallbackConditions.push(eq(schools.level, level as 'primary' | 'secondary'));
        }
        if (search && search.trim().length > 0) {
          const searchTerm = search.trim();
          if (searchTerm) {
            const nameCondition = like(schools.name, `%${searchTerm}%`);
            const addressCondition = like(schools.address, `%${searchTerm}%`);
            fallbackConditions.push(or(nameCondition, addressCondition));
          }
        }
        
        const fallbackResult = await db
          .select({
            id: schools.id,
            name: schools.name,
            address: schools.address,
            level: schools.level,
            website: schools.website,
            phone: schools.phone,
            email: schools.email,
            localityName: localities.name,
            countyName: counties.name
          })
          .from(schools)
          .leftJoin(localities, eq(schools.localityId, localities.id))
          .leftJoin(counties, eq(schools.countyId, counties.id))
          .where(and(...fallbackConditions))
          .orderBy(schools.name);
          
        return new Response(JSON.stringify({
          success: true,
          schools: fallbackResult,
          localityFiltered: false,
          message: `Only ${result.length} schools found in ${osmLocalityName}, showing all county schools`
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        schools: result,
        localityFiltered: !!osmLocalityName,
        localityName: osmLocalityName || null
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching schools:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch schools' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { name, address, countyId, localityId, level, website, phone, email, isActive } = body;

      // Validate required fields
      if (!name || !countyId || !level) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: name, countyId, level' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const [newSchool] = await db
        .insert(schools)
        .values({
          name,
          address,
          countyId,
          localityId: localityId || null,
          level,
          website,
          phone,
          email,
          csvSourceRow: null, // Mark as manually added (not from CSV)
          isActive: isActive || false // Use the isActive value from the form
        })
        .returning();

      return new Response(JSON.stringify({
        success: true,
        school: newSchool
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error creating school:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create school' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});