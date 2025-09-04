import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { emailFragments } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/email/fragments/default - expects body { id }
export const ServerRoute = createServerFileRoute('/api/email/fragments/default').methods({
  POST: async ({ request }) => {
    const { id } = await request.json();
    if (!id) return new Response(JSON.stringify({ success: false, error: 'id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    try {
      const rows = await db.select().from(emailFragments).where(eq(emailFragments.id, id)).limit(1);
      const frag = rows[0] as any;
      if (!frag) return new Response(JSON.stringify({ success: false, error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

      const all = await db.select().from(emailFragments);
      const sameType = all.filter((f: any) => f.type === frag.type);

      for (const f of sameType) {
        if (f.isDefault && f.id !== id) {
          await db.update(emailFragments).set({ isDefault: false, updatedAt: new Date() }).where(eq(emailFragments.id, f.id));
        }
      }
      await db.update(emailFragments).set({ isDefault: true, updatedAt: new Date() }).where(eq(emailFragments.id, id));

      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error('Failed to set default fragment', e);
      return new Response(JSON.stringify({ success: false, error: 'Failed to set default' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
});

