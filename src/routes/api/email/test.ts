import { createServerFileRoute } from '@tanstack/react-start/server';
import { EmailService } from '@/lib/services/email/email-service';
import * as v from 'valibot';

const testEmailSchema = v.object({
  settingId: v.string(),
  to: v.pipe(v.string(), v.email('Must be a valid email')),
  subject: v.pipe(v.string(), v.minLength(1, 'Subject is required')),
  body: v.pipe(v.string(), v.minLength(1, 'Body is required'))
});

export const ServerRoute = createServerFileRoute('/api/email/test').methods({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const validatedData = v.parse(testEmailSchema, body);

      // Send email using the EmailService
      const result = await EmailService.sendEmail({
        to: validatedData.to,
        subject: validatedData.subject,
        htmlContent: `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">Test Email</h2>
          <p>${validatedData.body.replace(/\n/g, '<br>')}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is a test email sent from your email configuration.
            <br>Setting ID: ${validatedData.settingId}
            <br>Sent at: ${new Date().toISOString()}
          </p>
        </div>`,
        textContent: `Test Email\n\n${validatedData.body}\n\n---\nThis is a test email sent from your email configuration.\nSetting ID: ${validatedData.settingId}\nSent at: ${new Date().toISOString()}`
      });

      if (result.success) {
        return new Response(JSON.stringify({ 
          success: true, 
          messageId: result.messageId,
          logId: result.logId
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          error: result.error 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('Failed to send test email:', error);

      if (error instanceof v.ValiError) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Validation failed', 
          details: error.issues 
        }), {
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to send test email' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});