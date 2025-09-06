import { createServerFileRoute } from '@tanstack/react-start/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user as userTable, verification as verificationTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/users-actions').methods({
  POST: async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }

      const body = await request.json();
      const { action, userId } = body as { action?: string; userId?: string };
      if (action !== 'resend-verification' || !userId) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Only admins can trigger this
      const [current] = await db.select({ role: userTable.role }).from(userTable).where(eq(userTable.id, session.user.id)).limit(1);
      if (!current || (current.role || '').toLowerCase() !== 'admin') {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Lookup the target user
      const [target] = await db.select({ id: userTable.id, email: userTable.email, name: userTable.name, emailVerified: userTable.emailVerified }).from(userTable).where(eq(userTable.id, userId)).limit(1);
      if (!target) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      if (target.emailVerified) {
        return new Response(JSON.stringify({ error: 'User is already verified' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Trigger Better Auth to send verification email by calling its endpoint
      // Better Auth will generate a new token and call our sendVerificationEmail handler configured in auth.ts
      const res = await auth.api.sendVerificationEmail({
        body: { email: target.email },
      } as any);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return new Response(JSON.stringify({ error: err?.message || 'Failed to resend verification' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error('users-actions error:', e);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
});

