import { createServerFileRoute } from '@tanstack/react-start/server';
import { BrandingService } from '@/lib/services/branding/branding-service';

export const ServerRoute = createServerFileRoute('/api/branding/active').methods({
  GET: async () => {
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
  },
});