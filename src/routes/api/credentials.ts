import { createServerFileRoute } from '@tanstack/react-start/server';
import { CredentialsService } from '@/lib/services/credentials/credentials-service';
import * as v from 'valibot';
import { insertCredentialSchema, updateCredentialSchema } from '@/db/schema/credentials';

export const ServerRoute = createServerFileRoute('/api/credentials').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/credentials')[1]; // Get the part after /api/credentials

      // Handle nested routes with IDs
      const pathParts = endpoint.split('/').filter(Boolean);
      const [id] = pathParts;

      if (id) {
        // Handle GET /api/credentials/{id}
        const credential = await CredentialsService.getCredentialById(id);

        if (!credential) {
          return new Response(
            JSON.stringify({ error: 'Credential not found', success: false }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(JSON.stringify({ data: credential, success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        // Handle GET /api/credentials
        const allCredentials = await CredentialsService.getAllCredentials();
        return new Response(JSON.stringify({ data: allCredentials, success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch credentials', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const validatedData = v.parse(insertCredentialSchema, body);

      const newCredential = await CredentialsService.createCredential(validatedData);
      return new Response(JSON.stringify({ data: newCredential, success: true }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to create credential:', error);

      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to create credential', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PUT: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/credentials')[1];
      const body = await request.json();

      // Handle nested routes with IDs
      const pathParts = endpoint.split('/').filter(Boolean);
      const [id] = pathParts;

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID is required for update' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const validatedData = v.parse(updateCredentialSchema, body);

      const updatedCredential = await CredentialsService.updateCredential(id, validatedData);

      return new Response(JSON.stringify({ data: updatedCredential, success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to update credential:', error);

      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to update credential', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/credentials')[1];

      // Handle nested routes with IDs
      const pathParts = endpoint.split('/').filter(Boolean);
      const [id] = pathParts;

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID is required for deletion' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const deletedCredential = await CredentialsService.deleteCredential(id);

      return new Response(JSON.stringify({ data: deletedCredential, success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to delete credential:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete credential', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});
