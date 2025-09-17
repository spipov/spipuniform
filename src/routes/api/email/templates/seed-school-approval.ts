import { createServerFileRoute } from '@tanstack/react-start/server';
import { EmailService } from '@/lib/services/email/email-service';
import { db } from '@/db';
import { emailTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { schoolApprovalEmailTemplates } from '@/data/school-approval-email-templates';

// Dev-only helper to create school approval templates if they don't exist
export const ServerRoute = createServerFileRoute('/api/email/templates/seed-school-approval').methods({
  POST: async () => {
    try {
      for (const template of schoolApprovalEmailTemplates) {
        const exists = await db
          .select()
          .from(emailTemplates)
          .where(eq(emailTemplates.name, template.name))
          .limit(1);
          
        if (!exists[0]) {
          await EmailService.createEmailTemplate({
            name: template.name,
            subject: template.subject,
            htmlContent: template.htmlContent,
            textContent: template.textContent,
            type: template.type,
            jsonContent: template.jsonContent,
            variables: template.variables,
            isActive: template.isActive,
          } as any);
          
          console.log(`Created email template: ${template.name}`);
        } else {
          console.log(`Email template already exists: ${template.name}`);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Processed ${schoolApprovalEmailTemplates.length} school approval email templates`,
        templates: schoolApprovalEmailTemplates.map(t => t.name)
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' } 
      });
    } catch (e) {
      console.error('Seeding school approval templates failed', e);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to seed school approval templates',
        details: e instanceof Error ? e.message : String(e)
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});