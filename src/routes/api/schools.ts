import { createServerFileRoute } from '@tanstack/react-start/server';
import postgres from 'postgres';
import { z } from 'zod';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(process.env.DATABASE_URL);

// Validation schema for school search
const schoolSearchSchema = z.object({
  query: z.string().optional(),
  county: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0)
});

export const ServerRoute = createServerFileRoute('/api/schools').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        query: url.searchParams.get('query') || undefined,
        county: url.searchParams.get('county') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '50'),
        offset: parseInt(url.searchParams.get('offset') || '0')
      };

      const validatedParams = schoolSearchSchema.parse(queryParams);

      // Build the base query
      let whereConditions = ['s.is_active = true'];
      let queryValues: any[] = [];
      let paramIndex = 1;

      // Search by name or address if query provided
      if (validatedParams.query) {
        whereConditions.push(`(s.name ILIKE $${paramIndex} OR s.address ILIKE $${paramIndex})`);
        queryValues.push(`%${validatedParams.query}%`);
        paramIndex++;
      }

      // Filter by county if provided
      if (validatedParams.county) {
        whereConditions.push(`c.name ILIKE $${paramIndex}`);
        queryValues.push(`%${validatedParams.county}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get schools with statistics
      const schoolQuery = `
        SELECT
          s.id,
          s.name,
          s.address,
          s.county_id as "countyId",
          s.locality_id as "localityId",
          s.level,
          s.website,
          s.phone,
          s.email,
          s.is_active as "isActive",
          s.created_at as "createdAt",
          s.updated_at as "updatedAt",
          c.name as "countyName",
          l.name as "localityName",
          0 as "listingCount",
          0 as "associatedAccountsCount"
        FROM schools s
        LEFT JOIN counties c ON s.county_id = c.id
        LEFT JOIN localities l ON s.locality_id = l.id
        WHERE ${whereClause}
        ORDER BY s.name
        LIMIT $${paramIndex}
        OFFSET $${paramIndex + 1}
      `;

      queryValues.push(validatedParams.limit, validatedParams.offset);
      const schoolResults = await sql.unsafe(schoolQuery, queryValues);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as count
        FROM schools s
        LEFT JOIN counties c ON s.county_id = c.id
        WHERE ${whereClause}
      `;

      const countValues = queryValues.slice(0, -2); // Remove limit and offset
      const countResult = await sql.unsafe(countQuery, countValues);

      const totalCount = countResult[0]?.count || 0;

      return new Response(JSON.stringify({
        success: true,
        schools: schoolResults.map(school => ({
          ...school,
          listingCount: Number(school.listingCount) || 0,
          associatedAccountsCount: Number(school.associatedAccountsCount) || 0
        })),
        pagination: {
          total: parseInt(String(totalCount)),
          limit: validatedParams.limit,
          offset: validatedParams.offset,
          hasMore: (validatedParams.offset + validatedParams.limit) < parseInt(String(totalCount))
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching enhanced schools:', error);
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid parameters',
          details: error.errors
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch schools'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});