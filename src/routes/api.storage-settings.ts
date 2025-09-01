import { createServerFileRoute } from '@tanstack/react-start/server';
import { StorageService } from '@/lib/services/file-system';
import { insertStorageSettingsSchema, updateStorageSettingsSchema } from '@/db/schema/file-system';
import * as v from 'valibot';

export const ServerRoute = createServerFileRoute('/api/storage-settings').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      const activeOnly = url.searchParams.get('activeOnly') === 'true';

      if (id) {
        // Get specific storage settings
        const settings = await StorageService.getStorageSettingsById(id);
        if (!settings) {
          return new Response(
            JSON.stringify({ success: false, error: 'Storage settings not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({ success: true, data: settings }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (activeOnly) {
        // Get only active storage settings
        const activeSettings = await StorageService.getActiveStorageSettings();
        return new Response(JSON.stringify({ success: true, data: activeSettings }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get all storage settings
      const allSettings = await StorageService.getAllStorageSettings();
      return new Response(JSON.stringify({ success: true, data: allSettings }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching storage settings:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch storage settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { action, ...data } = body;

      if (action === 'test') {
        // Test storage connection
        const { id } = data;
        if (!id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Storage settings ID is required for testing' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const testResult = await StorageService.testStorageConnection(id);
        return new Response(JSON.stringify({ success: true, data: testResult }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (action === 'activate') {
        // Activate storage settings
        const { id } = data;
        if (!id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Storage settings ID is required for activation' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const activatedSettings = await StorageService.activateStorageSettings(id);
        return new Response(JSON.stringify({ success: true, data: activatedSettings }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create new storage settings
      const validatedData = v.parse(insertStorageSettingsSchema, data);
      const newSettings = await StorageService.createStorageSettings(validatedData);
      
      return new Response(JSON.stringify({ success: true, data: newSettings }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error creating storage settings:', error);
      
      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create storage settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PUT: async ({ request }) => {
    try {
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Storage settings ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate input
      const validatedData = v.parse(updateStorageSettingsSchema, updateData);
      const updatedSettings = await StorageService.updateStorageSettings(id, validatedData);

      return new Response(JSON.stringify({ success: true, data: updatedSettings }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error updating storage settings:', error);
      
      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update storage settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Storage settings ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await StorageService.deleteStorageSettings(id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Storage settings deleted successfully' 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error deleting storage settings:', error);
      return new Response(
        JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to delete storage settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});