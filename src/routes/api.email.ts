import { createServerFileRoute } from '@tanstack/react-start/server';
import { EmailService } from '@/lib/services/email/email-service';
import { insertEmailTemplateSchema, updateEmailTemplateSchema } from '@/db/schema/email';
import * as v from 'valibot';

export const ServerRoute = createServerFileRoute('/api/email').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email')[1]; // Get the part after /api/email
      
      if (endpoint === '/templates') {
        // Handle /api/email/templates
        const templates = await EmailService.getAllTemplates();
        return new Response(JSON.stringify({ success: true, data: templates }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (endpoint === '/logs') {
        // Handle /api/email/logs
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const logs = await EmailService.getEmailLogs(limit, offset);
        return new Response(JSON.stringify({ success: true, data: logs }), {
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
      const body = await request.json();
      
      if (endpoint === '/templates') {
        // Handle POST /api/email/templates - Create new template
        const validatedData = v.parse(insertEmailTemplateSchema, body);
        const newTemplate = await EmailService.createTemplate(validatedData);
        return new Response(JSON.stringify({ success: true, data: newTemplate }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (endpoint === '/send') {
        // Handle POST /api/email/send - Send email
        const result = await EmailService.sendEmail(body);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 500,
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
      
      if (endpoint === '/templates') {
        // Handle PUT /api/email/templates - Update template
        const { id, ...updateData } = body;
        
        if (!id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Template ID is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        const validatedData = v.parse(updateEmailTemplateSchema, updateData);
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
      
      if (endpoint === '/templates') {
        // Handle DELETE /api/email/templates - Delete template
        const id = url.searchParams.get('id');
        
        if (!id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Template ID is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        // Note: EmailService doesn't have a deleteTemplate method, so we'll return a not implemented error
        return new Response(
          JSON.stringify({ success: false, error: 'Delete template functionality not implemented' }),
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