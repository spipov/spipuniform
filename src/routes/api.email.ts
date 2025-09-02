import { createServerFileRoute } from '@tanstack/react-start/server';
import { EmailService } from '@/lib/services/email/email-service';
import { insertEmailTemplateSchema, updateEmailTemplateSchema } from '@/db/schema/email';
import * as v from 'valibot';

export const ServerRoute = createServerFileRoute('/api/email').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email')[1]; // Get the part after /api/email
      
      // Handle nested routes with IDs (e.g., /settings/123/activate)
      const pathParts = endpoint.split('/').filter(Boolean);
      const [resource, id, action] = pathParts;
      
      if (resource === 'templates' && !id) {
        // Handle /api/email/templates
        const templates = await EmailService.getAllTemplates();
        return new Response(JSON.stringify({ success: true, data: templates }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (resource === 'logs' && !id) {
        // Handle /api/email/logs
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);
        const logs = await EmailService.getEmailLogs(limit, offset);
        return new Response(JSON.stringify({ success: true, data: logs }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (resource === 'settings' && !id) {
        // Handle /api/email/settings
        const settings = await EmailService.getAllSettings();
        return new Response(JSON.stringify({ success: true, data: settings }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        // Default: return all templates
        const templates = await EmailService.getAllTemplates();
        return new Response(JSON.stringify({ success: true, data: templates }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Error fetching email data:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch email data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email')[1];
      
      // Handle nested routes with IDs (e.g., /settings/123/activate)
      const pathParts = endpoint.split('/').filter(Boolean);
      const [resource, id, action] = pathParts;
      
      // Handle settings activation
      if (resource === 'settings' && id && action === 'activate') {
        // Set the setting as active and deactivate others
        await EmailService.deactivateAllSettings();
        const updatedSettings = await EmailService.updateSettings(id, { isActive: true });
        return new Response(JSON.stringify({ success: true, data: updatedSettings }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const body = await request.json();
      
      if (resource === 'templates' && !id) {
        // Handle POST /api/email/templates - Create new template
        const validatedData = v.parse(insertEmailTemplateSchema, body);
        const newTemplate = await EmailService.createTemplate(validatedData);
        return new Response(JSON.stringify({ success: true, data: newTemplate }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (resource === 'settings' && !id) {
        // Handle POST /api/email/settings - Create new settings
        const newSettings = await EmailService.createSettings(body);
        return new Response(JSON.stringify({ success: true, data: newSettings }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (resource === 'send' && !id) {
        // Handle POST /api/email/send - Send email
        const result = await EmailService.sendEmail(body);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 500,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (resource === 'test' && !id) {
        // Handle POST /api/email/test - Send test email
        const testEmailSchema = v.object({
          settingId: v.pipe(v.string(), v.minLength(1, 'Setting ID is required')),
          to: v.pipe(v.string(), v.email('Must be a valid email address')),
          subject: v.pipe(v.string(), v.minLength(1, 'Subject is required')),
          body: v.pipe(v.string(), v.minLength(1, 'Body is required')),
        });

        const validatedData = v.parse(testEmailSchema, body);

        // Get the specific email settings to test
        const settings = await EmailService.getEmailSettingById(validatedData.settingId);
        if (!settings) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Email settings not found'
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Create transporter for the specific settings
        const transporter = await EmailService.createTransporter(settings);

        // Send test email directly using the transporter
        const mailOptions = {
          from: `${settings.fromName} <${settings.fromEmail}>`,
          to: validatedData.to,
          subject: validatedData.subject,
          html: validatedData.body.replace(/\n/g, '<br>'),
          text: validatedData.body,
        };

        const info = await transporter.sendMail(mailOptions);

        // Import db and emailLogs for logging
        const { db } = await import('@/db');
        const { emailLogs } = await import('@/db/schema');

        // Log the test email to database
        await db.insert(emailLogs).values({
          toEmail: validatedData.to,
          fromEmail: settings.fromEmail,
          subject: validatedData.subject,
          settingsId: settings.id,
          provider: settings.provider,
          status: 'sent',
          sentAt: new Date(),
          messageId: info.messageId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return new Response(JSON.stringify({
          success: true,
          message: 'Test email sent successfully',
          data: { messageId: info.messageId }
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid endpoint' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Error processing email request:', error);
      
      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to process email request' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PUT: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email')[1];
      const body = await request.json();
      
      // Handle nested routes with IDs (e.g., /settings/123)
      const pathParts = endpoint.split('/').filter(Boolean);
      const [resource, id] = pathParts;
      
      if (resource === 'templates' && id) {
        // Handle PUT /api/email/templates/123 - Update template
        const validatedData = v.parse(updateEmailTemplateSchema, body);
        const updatedTemplate = await EmailService.updateTemplate(id, validatedData);
        
        if (!updatedTemplate) {
          return new Response(
            JSON.stringify({ success: false, error: 'Template not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(JSON.stringify({ success: true, data: updatedTemplate }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (resource === 'settings' && id) {
        // Handle PUT /api/email/settings/123 - Update settings
        const updatedSettings = await EmailService.updateSettings(id, body);
        
        if (!updatedSettings) {
          return new Response(
            JSON.stringify({ success: false, error: 'Settings not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(JSON.stringify({ success: true, data: updatedSettings }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid endpoint' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Error updating email data:', error);
      
      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update email data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email')[1];
      
      // Handle nested routes with IDs (e.g., /settings/123)
      const pathParts = endpoint.split('/').filter(Boolean);
      const [resource, id] = pathParts;
      
      if (resource === 'templates' && id) {
        // Handle DELETE /api/email/templates/123 - Delete template
        // Note: EmailService doesn't have a deleteTemplate method, so we'll return a not implemented error
        return new Response(
          JSON.stringify({ success: false, error: 'Delete template functionality not implemented' }),
          { status: 501, headers: { 'Content-Type': 'application/json' } }
        );
      } else if (resource === 'settings' && id) {
        // Handle DELETE /api/email/settings/123 - Delete settings
        // Note: EmailService doesn't have a deleteSettings method, so we'll return a not implemented error
        return new Response(
          JSON.stringify({ success: false, error: 'Delete settings functionality not implemented' }),
          { status: 501, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid endpoint' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Error deleting email data:', error);
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete email data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});