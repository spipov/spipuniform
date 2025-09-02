import { createServerFileRoute } from '@tanstack/react-start/server';
import { EmailService } from '@/lib/services/email/email-service';
import * as v from 'valibot';
import { insertEmailTemplateSchema, updateEmailTemplateSchema } from '@/db/schema/email';

export const ServerRoute = createServerFileRoute('/api/email/templates').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email/templates')[1];

      const pathParts = endpoint.split('/').filter(Boolean);
      const [id] = pathParts;

      if (id) {
        const template = await EmailService.getEmailTemplateById(id);
        if (!template) {
          return new Response(
            JSON.stringify({ error: 'Email template not found', success: false }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({ data: template, success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        const allTemplates = await EmailService.getAllEmailTemplates();
        return new Response(JSON.stringify({ data: allTemplates, success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch email templates', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const validatedData = v.parse(insertEmailTemplateSchema, body);
      const newTemplate = await EmailService.createEmailTemplate(validatedData);

      return new Response(JSON.stringify({ data: newTemplate, success: true }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to create email template:', error);

      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to create email template', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PUT: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email/templates')[1];
      const body = await request.json();

      const pathParts = endpoint.split('/').filter(Boolean);
      const [id] = pathParts;

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID is required for update' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const validatedData = v.parse(updateEmailTemplateSchema, body);
      const updatedTemplate = await EmailService.updateEmailTemplate(id, validatedData);

      return new Response(JSON.stringify({ data: updatedTemplate, success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to update email template:', error);

      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to update email template', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email/templates')[1];

      const pathParts = endpoint.split('/').filter(Boolean);
      const [id] = pathParts;

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID is required for deletion' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const deletedTemplate = await EmailService.deleteEmailTemplate(id);

      return new Response(JSON.stringify({ data: deletedTemplate, success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to delete email template:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete email template', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});