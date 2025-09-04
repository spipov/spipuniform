import { createServerFileRoute } from '@tanstack/react-start/server';
import * as v from 'valibot';
import { EmailService } from '@/lib/services/email/email-service';
import { insertEmailFragmentSchema, updateEmailFragmentSchema } from '@/db/schema/email';

export const ServerRoute = createServerFileRoute('/api/email/fragments').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email/fragments')[1];
      const pathParts = endpoint.split('/').filter(Boolean);
      const [idOrType] = pathParts;

      if (idOrType) {
        // if UUID, fetch by id; else treat as type filter
        if (idOrType.includes('-')) {
          const frag = await EmailService.getEmailFragmentById(idOrType);
          if (!frag) {
            return new Response(JSON.stringify({ success: false, error: 'Fragment not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
          }
          return new Response(JSON.stringify({ success: true, data: frag }), { headers: { 'Content-Type': 'application/json' } });
        }
        const frags = await EmailService.getEmailFragmentsByType(idOrType as any);
        return new Response(JSON.stringify({ success: true, data: frags }), { headers: { 'Content-Type': 'application/json' } });
      }

      const all = await EmailService.getAllEmailFragments();
      return new Response(JSON.stringify({ success: true, data: all }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error('Failed to fetch fragments:', error);
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch fragments' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const data = v.parse(insertEmailFragmentSchema, body);
      const created = await EmailService.createEmailFragment(data);
      return new Response(JSON.stringify({ success: true, data: created }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      if (error instanceof v.ValiError) {
        return new Response(JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      console.error('Failed to create fragment:', error);
      return new Response(JSON.stringify({ success: false, error: 'Failed to create fragment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  },

  PUT: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email/fragments')[1];
      const pathParts = endpoint.split('/').filter(Boolean);
      const [id] = pathParts;
      if (!id) {
        return new Response(JSON.stringify({ success: false, error: 'ID is required for update' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const body = await request.json();
      const data = v.parse(updateEmailFragmentSchema, body);
      const updated = await EmailService.updateEmailFragment(id, data);
      return new Response(JSON.stringify({ success: true, data: updated }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      if (error instanceof v.ValiError) {
        return new Response(JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      console.error('Failed to update fragment:', error);
      return new Response(JSON.stringify({ success: false, error: 'Failed to update fragment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  },

  DELETE: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/email/fragments')[1];
      const pathParts = endpoint.split('/').filter(Boolean);
      const [id] = pathParts;
      if (!id) {
        return new Response(JSON.stringify({ success: false, error: 'ID is required for deletion' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const deleted = await EmailService.deleteEmailFragment(id);
      return new Response(JSON.stringify({ success: true, data: deleted }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error('Failed to delete fragment:', error);
      return new Response(JSON.stringify({ success: false, error: 'Failed to delete fragment' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  },
});

