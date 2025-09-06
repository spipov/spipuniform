import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { user, roles } from '@/db/schema';
import { eq, like, desc, asc, count, ilike } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import * as v from 'valibot';
import { roleSearchSchema, createRoleSchema } from '@/schemas/user-management';

export const ServerRoute = createServerFileRoute('/api/roles').methods({
  GET: async ({ request }) => {
    try {
      
      // Check authentication
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check permissions
      const currentUser = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (!currentUser[0] || (currentUser[0].role || '').toLowerCase() !== 'admin') {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Parse query parameters
      const url = new URL(request.url);
      const searchParams = {
        search: url.searchParams.get('search') || undefined,
        page: parseInt(url.searchParams.get('page') || '1'),
        limit: parseInt(url.searchParams.get('limit') || '10'),
        sortBy: url.searchParams.get('sortBy') || 'createdAt',
        sortOrder: url.searchParams.get('sortOrder') || 'desc',
      };

      const validatedParams = v.parse(roleSearchSchema, searchParams);
      const { search, page, limit, sortBy, sortOrder } = validatedParams;

      // Build where conditions
      const whereClause = search ? ilike(roles.name, `%${search}%`) : undefined;

      // Get total count
      const [totalResult] = await db.select({ count: count() }).from(roles).where(whereClause);

      // Get roles with user count
      const orderBy = sortOrder === 'asc' ? asc(roles[sortBy]) : desc(roles[sortBy]);
      const rolesList = await db
        .select({
          id: roles.id,
          name: roles.name,
          permissions: roles.permissions,
          color: roles.color,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt,
        })
        .from(roles)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit);

      // Get user count for each role
      const rolesWithUserCount = await Promise.all(
        rolesList.map(async (role) => {
          const [userCount] = await db
            .select({ count: count() })
            .from(user)
            .where(eq(user.role, role.name));
          return {
            ...role,
            userCount: userCount.count,
          };
        })
      );

      return new Response(JSON.stringify({
        roles: rolesWithUserCount,
        pagination: {
          page,
          limit,
          total: totalResult.count,
          pages: Math.ceil(totalResult.count / limit),
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  POST: async ({ request }) => {
    try {
      
      // Check authentication and permissions
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const currentUser = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (!currentUser[0] || (currentUser[0].role || '').toLowerCase() !== 'admin') {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const body = await request.json();
      const validatedData = v.parse(createRoleSchema, body);

      // Check if role name already exists
      const existingRole = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, validatedData.name))
        .limit(1);

      if (existingRole.length > 0) {
        return new Response(JSON.stringify({ error: 'Role name already exists' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create role
      const [newRole] = await db
        .insert(roles)
        .values({
          name: validatedData.name,
          permissions: validatedData.permissions,
          color: validatedData.color,
        })
        .returning({
          id: roles.id,
          name: roles.name,
          permissions: roles.permissions,
          color: roles.color,
          createdAt: roles.createdAt,
        });

      return new Response(JSON.stringify({ role: newRole }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (error instanceof v.ValiError) {
        return new Response(JSON.stringify({ error: 'Validation error', details: error.issues }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('Error creating role:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
});