import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { ApprovalService } from '@/lib/services/approval-service';
import { auth } from '@/lib/auth';
import { EmailService } from '@/lib/services/email/email-service';

export const ServerRoute = createServerFileRoute('/api/users-approval').methods({
  // Count pending users
  GET: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const result = await db
      .select({ count: count() })
      .from(user)
      .where(and(eq(user.banned, true), eq(user.banReason, 'PENDING_APPROVAL')));

    const pending = Number(result?.[0]?.count ?? 0);
    return new Response(JSON.stringify({ data: { pending } }), { headers: { 'Content-Type': 'application/json' } });
  },

  // Approve or reject
  POST: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { userId, action } = await request.json();
    if (!userId || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    if (action === 'approve') {
      await ApprovalService.approveUser(userId);
      return new Response(JSON.stringify({ success: true }));
    }

    await ApprovalService.rejectUser(userId);
    return new Response(JSON.stringify({ success: true }));
  },
});

