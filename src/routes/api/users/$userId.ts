import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { user, account as accountTable, session as sessionTable, verification as verificationTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import * as v from 'valibot';
import { updateUserSchema } from '@/schemas/user-management';

export const ServerRoute = createServerFileRoute('/api/users/$userId').methods({
  PUT: async ({ request, params }) => {
    try {
      // Check authentication
      const authSession = await auth.api.getSession({ headers: request.headers });
      if (!authSession) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check permissions - only admin can update user roles
      const currentUser = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, authSession.user.id))
        .limit(1);

      if (!currentUser[0] || (currentUser[0].role || '').toLowerCase() !== 'admin') {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userId = params.userId;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const body = await request.json();
      const validatedData = v.parse(updateUserSchema, body);

      // Check if user exists
      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Update user
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (validatedData.name) updateData.name = validatedData.name;
      if (validatedData.email) updateData.email = validatedData.email;
      if (validatedData.role !== undefined) updateData.role = validatedData.role;
      if (validatedData.banned !== undefined) updateData.banned = validatedData.banned;
      if (validatedData.banReason !== undefined) updateData.banReason = validatedData.banReason;
      if (validatedData.banExpires !== undefined) updateData.banExpires = validatedData.banExpires;

      const [updatedUser] = await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, userId))
        .returning({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          banned: user.banned,
          banReason: user.banReason,
          banExpires: user.banExpires,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

      return new Response(JSON.stringify({ user: updatedUser }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (error instanceof v.ValiError) {
        return new Response(JSON.stringify({ error: 'Validation error', details: error.issues }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('Error updating user:', error);
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

      const userId = params.userId;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Prevent self-deletion
      if (userId === session.user.id) {
        return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Delete related Better Auth rows first to satisfy FKs
      await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
      await db.delete(accountTable).where(eq(accountTable.userId, userId));
      await db.delete(verificationTable).where(eq(verificationTable.identifier, userId));

      // Delete user
      await db.delete(user).where(eq(user.id, userId));

      return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
});