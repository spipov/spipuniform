import { createServerFileRoute } from '@tanstack/react-start/server';
import { EmailService } from '@/lib/services/email/email-service';
import * as v from 'valibot';
import { insertEmailSettingsSchema, updateEmailSettingsSchema } from '@/db/schema/email';

export const ServerRoute = createServerFileRoute('/api/email/settings').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email/settings')[1];

      const pathParts = endpoint.split('/').filter(Boolean);
      const [id, action] = pathParts;

      if (id && action === 'activate') {
        return new Response(
          JSON.stringify({ error: 'Use POST method to activate setting' }),
          { status: 405, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (id) {
        const setting = await EmailService.getEmailSettingById(id);
        if (!setting) {
          return new Response(
            JSON.stringify({ error: 'Email setting not found', success: false }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({ data: setting, success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        const allSettings = await EmailService.getAllEmailSettings();
        return new Response(JSON.stringify({ data: allSettings, success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Failed to fetch email settings:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch email settings', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email/settings')[1];
      const pathParts = endpoint.split('/').filter(Boolean);
      const [id, action] = pathParts;

      if (id && action === 'activate') {
        const activatedSetting = await EmailService.activateEmailSetting(id);
        return new Response(JSON.stringify({ data: activatedSetting, success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const body = await request.json();
      // Remove fields that shouldn't be sent for new records
      const { id: bodyId, createdAt, updatedAt, ...cleanBody } = body;
      const validatedData = v.parse(insertEmailSettingsSchema, cleanBody);
      const newSetting = await EmailService.createEmailSetting(validatedData);

      return new Response(JSON.stringify({ data: newSetting, success: true }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to create/activate email setting:', error);

      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to process email setting', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PUT: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email/settings')[1];
      const body = await request.json();

      const pathParts = endpoint.split('/').filter(Boolean);
      const [id] = pathParts;

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID is required for update' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Remove fields that shouldn't be updated
      const { id: bodyId, createdAt, updatedAt, ...cleanBody } = body;
      const validatedData = v.parse(updateEmailSettingsSchema, cleanBody);
      const updatedSetting = await EmailService.updateEmailSetting(id, validatedData);

      return new Response(JSON.stringify({ data: updatedSetting, success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to update email setting:', error);

      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to update email setting', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email/settings')[1];

      const pathParts = endpoint.split('/').filter(Boolean);
      const [id] = pathParts;

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID is required for deletion' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const deletedSetting = await EmailService.deleteEmailSetting(id);

      return new Response(JSON.stringify({ data: deletedSetting, success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to delete email setting:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete email setting', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});