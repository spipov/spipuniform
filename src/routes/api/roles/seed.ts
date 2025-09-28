import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { roles, user as userTable } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/roles/seed').methods({
  POST: async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

      // Only admins can seed roles
      const [me] = await db.select({ role: userTable.role }).from(userTable).where(eq(userTable.id, session.user.id)).limit(1);
      if (!me || (me.role || '').toLowerCase() !== 'admin') {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
      }

      const defaults = [
        { name: 'admin', description: 'Administrator', isSystem: true, color: '#EF4444' },
        { name: 'moderator', description: 'Moderator', isSystem: true, color: '#F59E0B' },
        { name: 'user', description: 'Standard User', isSystem: true, color: '#6B7280' },
        { name: 'family', description: 'Parent', isSystem: false, color: '#3B82F6' },
        { name: 'shop', description: 'Shop Owner', isSystem: false, color: '#10B981' },
        { name: 'school_rep', description: 'School Representative', isSystem: false, color: '#6366F1' },
      ];

      // Insert missing roles only
      for (const r of defaults) {
        try {
          await db.insert(roles).values({
            name: r.name,
            description: r.description,
            isSystem: r.isSystem,
            color: r.color,
            permissions: {
              viewDashboard: true,
              viewUserManagement: r.name === 'admin' || r.name === 'moderator',
              manageUsers: r.name === 'admin',
              manageRoles: r.name === 'admin',
              assignRoles: r.name === 'admin',
            },
          }).onConflictDoNothing();
        } catch {}
      }

      const rows = await db.select().from(roles);
      return new Response(JSON.stringify({ roles: rows }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error('roles seed failed', e);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
  },
});

