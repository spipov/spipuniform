import { createServerFileRoute } from '@tanstack/react-start/server';
import { BrandingService } from '@/lib/services/branding/branding-service';
import { insertBrandingSchema, updateBrandingSchema } from '@/db/schema/branding';
import * as v from 'valibot';

// API route for branding management

export const ServerRoute = createServerFileRoute('/api/branding').methods({
  GET: async ({ request }) => {
    try {
      const brandingConfigs = await BrandingService.getAllBranding();
      return new Response(JSON.stringify({ success: true, data: brandingConfigs }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching branding configurations:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch branding configurations' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      
      // Validate input
      const validatedData = v.parse(insertBrandingSchema, body);
      
      const newBranding = await BrandingService.createBranding(validatedData);
      return new Response(JSON.stringify({ success: true, data: newBranding }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error creating branding configuration:', error);
      
      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create branding configuration' }),
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
          JSON.stringify({ success: false, error: 'Branding ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Validate input
      const validatedData = v.parse(updateBrandingSchema, updateData);
      
      const updatedBranding = await BrandingService.updateBranding(id, validatedData);
      
      if (!updatedBranding) {
        return new Response(
          JSON.stringify({ success: false, error: 'Branding configuration not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(JSON.stringify({ success: true, data: updatedBranding }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error updating branding configuration:', error);
      
      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update branding configuration' }),
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
          JSON.stringify({ success: false, error: 'Branding ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const deleted = await BrandingService.deleteBranding(id);
      
      if (!deleted) {
        return new Response(
          JSON.stringify({ success: false, error: 'Branding configuration not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(JSON.stringify({ success: true, message: 'Branding configuration deleted successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error deleting branding configuration:', error);
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete branding configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});