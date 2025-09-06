import { createServerFileRoute } from '@tanstack/react-start/server';
import { AuthSettingsService } from '@/lib/services/auth-settings-service';
import { auth } from '@/lib/auth';
import { ApprovalService } from '@/lib/services/approval-service';
import { db } from '@/db';
import { user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/services/email/email-service';

// This endpoint should be called client-side immediately after a successful sign-up
// It will mark the new user as pending if required and notify admins
export const ServerRoute = createServerFileRoute('/api/auth/signup-post-hook').methods({
  POST: async ({ request }) => {
    try {
      const { userId } = await request.json();
      if (!userId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });

      const settings = await AuthSettingsService.get();
      const requireApproval = Boolean(settings?.requireAdminApproval);

      if (!requireApproval) {
        return new Response(JSON.stringify({ success: true, action: 'none' }), { headers: { 'Content-Type': 'application/json' } });
      }

      // Mark pending (banned + reason)
      await ApprovalService.markPending(userId);

      // Email all admins that someone is pending
      const admins = await db.select({ id: userTable.id, email: userTable.email, name: userTable.name }).from(userTable).where(eq(userTable.role, 'admin'));
      const pendingUserRows = await db.select({ email: userTable.email, name: userTable.name }).from(userTable).where(eq(userTable.id, userId)).limit(1);
      const pendingUser = pendingUserRows[0];

      try {
        if (admins.length > 0) {
          // Use template if it exists; otherwise fallback to a simple branded email to avoid hard failures
          const template = await EmailService.getTemplateByName('Approval Pending');
          if (template) {
            await EmailService.sendEmail({
              to: admins.map(a => a.email),
              template: 'Approval Pending',
              subject: 'New user awaiting approval',
              variables: { user_name: pendingUser?.name || '', user_email: pendingUser?.email || '' },
            });
          } else {
            await EmailService.sendEmail({
              to: admins.map(a => a.email),
              subject: 'New user awaiting approval',
              htmlContent: `<h2>New user pending approval</h2><p>Name: ${pendingUser?.name || ''}</p><p>Email: ${pendingUser?.email || ''}</p><p>Please visit the admin dashboard to approve or reject.</p>`,
              textContent: `New user pending approval\nName: ${pendingUser?.name || ''}\nEmail: ${pendingUser?.email || ''}\nPlease visit the admin dashboard to approve or reject.`,
            });
          }
        }
      } catch {}

      return new Response(JSON.stringify({ success: true, action: 'marked_pending' }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error('signup-post-hook failed', e);
      return new Response(JSON.stringify({ error: 'Failed post signup hook' }), { status: 500 });
    }
  }
});

