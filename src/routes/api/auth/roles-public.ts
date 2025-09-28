import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { roles } from '@/db/schema';
import { eq, or, and, not } from 'drizzle-orm';

// Public endpoint: list roles available for sign-up selection
// We intentionally do NOT require auth and we filter out system/admin roles
export const ServerRoute = createServerFileRoute('/api/auth/roles-public').methods({
  GET: async () => {
    try {
      // Prefer explicit non-system roles
      const rows = await db
        .select({ name: roles.name, isSystem: roles.isSystem })
        .from(roles);

      const all = rows?.map((r) => r.name) || [];
      // Fallback defaults if table empty or missing expected roles
      const defaults = ['family', 'shop', 'school_rep', 'user'];

      // Filter out system roles and obvious admin/moderator roles
      const allowed = (all.length ? all : defaults)
        .filter((n) => !['admin', 'moderator', 'owner', 'superadmin'].includes((n || '').toLowerCase()));

      // Provide display labels for common roles
      const displayMap: Record<string, string> = {
        family: 'Parent',
        shop: 'Shop Owner',
        school_rep: 'School Rep',
        user: 'User',
      };

      const items = allowed.map((name) => ({
        name,
        label: displayMap[name] || name.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
      }));

      return new Response(JSON.stringify({ roles: items }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('roles-public failed', e);
      // Very defensive fallback to avoid blocking signups UI
      return new Response(JSON.stringify({ roles: [
        { name: 'family', label: 'Parent' },
        { name: 'shop', label: 'Shop Owner' },
        { name: 'school_rep', label: 'School Rep' },
        { name: 'user', label: 'User' },
      ]}), { headers: { 'Content-Type': 'application/json' } });
    }
  },
});

