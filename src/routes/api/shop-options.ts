import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { localities, schools, counties } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/shop-options').methods({
  GET: async ({ request }) => {
    try {
      // Validate session using Better Auth
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get all localities with county names and schools for the shop registration form
      const [localitiesList, schoolsList] = await Promise.all([
        db.select({
          id: localities.id,
          name: localities.name,
          county: counties.name
        })
        .from(localities)
        .leftJoin(counties, eq(localities.countyId, counties.id))
        .orderBy(localities.name),
        
        db.select({
          id: schools.id,
          name: schools.name,
          type: schools.level, // Using level as type
          localityId: schools.localityId
        }).from(schools).orderBy(schools.name)
      ]);
      
      return new Response(JSON.stringify({
        success: true,
        localities: localitiesList,
        schools: schoolsList
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching shop options:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch options'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});