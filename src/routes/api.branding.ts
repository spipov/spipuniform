import { createServerFileRoute } from '@tanstack/react-start/server';
import { BrandingService } from '@/lib/services/branding/branding-service';
import { insertBrandingSchema, updateBrandingSchema } from '@/db/schema/branding';
import * as v from 'valibot';

// API route for branding management

export const ServerRoute = createServerFileRoute('/api/branding').methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const endpoint = url.pathname.split('/api/branding')[1];

    // Handle complete branding CSS endpoint
    if (endpoint === '/branding.css') {
      const brandingCSS = await BrandingService.generateBrandingCSS();
      return new Response(brandingCSS, {
        headers: {
          'Content-Type': 'text/css',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    }

    // Handle custom font CSS endpoint (legacy)
    if (endpoint === '/fonts.css') {
      const customFontCSS = await BrandingService.generateCustomFontCSS();
      return new Response(customFontCSS, {
        headers: {
          'Content-Type': 'text/css',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    // Handle active branding endpoint
    if (endpoint === '/active') {
      try {
        const activeBranding = await BrandingService.getActiveBranding();
        return new Response(JSON.stringify({ success: true, data: activeBranding }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error fetching active branding:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch active branding' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Regular branding configurations
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
      const url = new URL(request.url);
      const endpoint = url.pathname.split('/api/branding')[1];

      if (endpoint === '/activate') {
        // Handle activation request
        const body = await request.json();
        const { id } = body;

        if (!id) {
          return new Response(
            JSON.stringify({ success: false, error: 'ID is required for activation' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const activatedBranding = await BrandingService.activateBranding(id);
        return new Response(JSON.stringify({ data: activatedBranding, success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        // Handle creation request
        const body = await request.json();
        
        // Clean data before validation
        // Only keep known fields to avoid validation errors from extra keys
        const allowedKeys = ['siteName','siteDescription','siteUrl','logoUrl','logoAlt','faviconUrl','logoDisplayMode','primaryColor','secondaryColor','accentColor','backgroundColor','textColor','fontFamily','headingFont','borderRadius','spacing','supportEmail','contactPhone','socialLinks','customCss','isActive','version'];
        const cleanedData: any = {};
        for (const key of allowedKeys) {
          if (key in body) cleanedData[key] = (body as any)[key];
        }
        
        // Clean social links - remove empty strings
        if (cleanedData.socialLinks) {
          const cleanedSocialLinks: any = {};
          for (const [key, value] of Object.entries(cleanedData.socialLinks)) {
            if (value && typeof value === 'string' && value.trim().length > 0) {
              let urlStr = value.trim();
              if (!/^https?:\/\//i.test(urlStr)) urlStr = `https://${urlStr}`;
              cleanedSocialLinks[key] = urlStr;
            }
          }
          cleanedData.socialLinks = Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : undefined;
        }

        // Clean other fields - convert empty strings to undefined
        ['logoUrl', 'faviconUrl', 'siteUrl', 'siteDescription', 'logoAlt',
         'supportEmail', 'contactPhone', 'customCss', 'fontFamily', 'headingFont',
         'borderRadius', 'spacing'].forEach(field => {
          if (cleanedData[field] === '' || cleanedData[field] === null) {
            cleanedData[field] = undefined;
          }
        });

        // Normalize siteUrl scheme if present
        if (cleanedData.siteUrl && typeof cleanedData.siteUrl === 'string' && !/^https?:\/\//i.test(cleanedData.siteUrl)) {
          cleanedData.siteUrl = `https://${cleanedData.siteUrl}`;
        }

        // Validate input
        const validatedData = v.parse(insertBrandingSchema, cleanedData);
        
        const newBranding = await BrandingService.createBranding(validatedData);
        return new Response(JSON.stringify({ success: true, data: newBranding }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Error processing branding request:', error);
      
      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to process branding request' }),
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
      
      // Clean data before validation
      // Only keep known fields to avoid validation errors from extra keys
      const allowedKeys = ['siteName','siteDescription','siteUrl','logoUrl','logoAlt','faviconUrl','logoDisplayMode','primaryColor','secondaryColor','accentColor','backgroundColor','textColor','fontFamily','headingFont','borderRadius','spacing','supportEmail','contactPhone','socialLinks','customCss','isActive','version'];
      const cleanedData: any = {};
      for (const key of allowedKeys) {
        if (key in updateData) cleanedData[key] = (updateData as any)[key];
      }
      
      // Clean social links - remove empty strings
      if (cleanedData.socialLinks) {
        const cleanedSocialLinks: any = {};
        for (const [key, value] of Object.entries(cleanedData.socialLinks)) {
          if (value && typeof value === 'string' && value.trim().length > 0) {
            cleanedSocialLinks[key] = value.trim();
          }
        }
        cleanedData.socialLinks = Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : undefined;
      }
      
      // Clean other fields - convert empty strings to undefined
      ['logoUrl', 'faviconUrl', 'siteUrl', 'siteDescription', 'logoAlt', 
       'supportEmail', 'contactPhone', 'customCss', 'fontFamily', 'headingFont',
       'borderRadius', 'spacing'].forEach(field => {
        if (cleanedData[field] === '' || cleanedData[field] === null) {
          cleanedData[field] = undefined;
        }
      });
      
      // Validate input
      const validatedData = v.parse(updateBrandingSchema, cleanedData);
      
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

      // Check if it's a specific business logic error
      if (error instanceof Error) {
        if (error.message.includes('Cannot delete active branding')) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (error.message.includes('not found')) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete branding configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});