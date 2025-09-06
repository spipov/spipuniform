import { createServerFileRoute } from '@tanstack/react-start/server';
import { EmailService } from '@/lib/services/email/email-service';
import { db } from '@/db';
import { emailTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Dev-only helper to create the two approval-related templates if they don't exist
export const ServerRoute = createServerFileRoute('/api/email/templates/seed-approval').methods({
  POST: async () => {
    try {
      const desired = [
        {
          name: 'Approval Pending',
          subject: 'New user awaiting approval',
          htmlContent:
            '<h2>New user pending approval</h2><p>Name: {{user_name}}</p><p>Email: {{user_email}}</p><p>Visit the dashboard to approve or reject.</p>',
          textContent:
            'New user pending approval\nName: {{user_name}}\nEmail: {{user_email}}\nVisit the dashboard to approve or reject.',
          isActive: true,
        },
        {
          name: 'Approval Rejected',
          subject: 'Your account application was not approved',
          htmlContent:
            '<p>Hi {{user_name}},</p><p>We\'re sorry, your account could not be approved at this time. If you believe this is a mistake, please contact our support team: {{support_email}}</p>',
          textContent:
            'Hi {{user_name}},\nWe\'re sorry, your account could not be approved at this time. Contact support: {{support_email}}',
          isActive: true,
        },
      ];

      for (const t of desired) {
        const exists = await db.select().from(emailTemplates).where(eq(emailTemplates.name, t.name)).limit(1);
        if (!exists[0]) {
          await EmailService.createEmailTemplate({
            name: t.name,
            subject: t.subject,
            htmlContent: t.htmlContent,
            textContent: t.textContent,
            isActive: true,
          } as any);
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error('Seeding approval templates failed', e);
      return new Response(JSON.stringify({ error: 'Failed to seed templates' }), { status: 500 });
    }
  }
});

