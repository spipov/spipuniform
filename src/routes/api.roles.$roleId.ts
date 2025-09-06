import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { user, roles } from '@/db/schema';
import { eq, and, ne, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import * as v from 'valibot';
import { updateRoleSchema } from '@/schemas/user-management';

export const ServerRoute = createServerFileRoute('/api/roles/$roleId').methods({
  PUT: async ({ request, params }) => {
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

      const roleId = params.roleId;
      if (!roleId) {
        return new Response(JSON.stringify({ error: 'Role ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const body = await request.json();
      const validatedData = v.parse(updateRoleSchema, body);

      // Check if role exists
      const existingRole = await db
        .select({ id: roles.id, name: roles.name })
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      if (existingRole.length === 0) {
        return new Response(JSON.stringify({ error: 'Role not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if new name conflicts with existing role (if name is being changed)
      if (validatedData.name !== existingRole[0].name) {
        const nameConflict = await db
          .select({ id: roles.id })
          .from(roles)
          .where(and(eq(roles.name, validatedData.name), ne(roles.id, roleId)))
          .limit(1);

        if (nameConflict.length > 0) {
          return new Response(JSON.stringify({ error: 'Role name already exists' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // Update role
      const [updatedRole] = await db
        .update(roles)
        .set({
          name: validatedData.name,
          permissions: validatedData.permissions,
          color: validatedData.color,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, roleId))
        .returning({
          id: roles.id,
          name: roles.name,
          permissions: roles.permissions,
          color: roles.color,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt,
        });

      // IMPORTANT: Sync with Better Auth - update user.role field for all users with this role
      if (validatedData.name !== existingRole[0].name) {
        await db
          .update(user)
          .set({ role: validatedData.name })
          .where(eq(user.role, existingRole[0].name));
        
        console.log(`Updated user roles from "${existingRole[0].name}" to "${validatedData.name}"`);
      }

      return new Response(JSON.stringify({ role: updatedRole }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (error instanceof v.ValiError) {
        return new Response(JSON.stringify({ error: 'Validation error', details: error.issues }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('Error updating role:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  DELETE: async ({ request, params }) => {
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

      const roleId = params.roleId;
      if (!roleId) {
        return new Response(JSON.stringify({ error: 'Role ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if role exists
      const existingRole = await db
        .select({ id: roles.id, name: roles.name })
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      if (existingRole.length === 0) {
        return new Response(JSON.stringify({ error: 'Role not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if role is in use
      const [usersWithRole] = await db
        .select({ count: count() })
        .from(user)
        .where(eq(user.role, existingRole[0].name));

      if (usersWithRole.count > 0) {
        return new Response(JSON.stringify({ 
          error: `Cannot delete role "${existingRole[0].name}" - it is assigned to ${usersWithRole.count} user(s). Please reassign users first.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Delete role
      await db.delete(roles).where(eq(roles.id, roleId));

      return new Response(JSON.stringify({ message: 'Role deleted successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
});