import { createServerFileRoute } from '@tanstack/react-start/server';
import { AuthSettingsService } from '@/lib/services/auth-settings-service';

// Minimal GET endpoint for client usage
export const ServerRoute = createServerFileRoute('/api/auth-settings/flag').methods({
  GET: async () => {
    const settings = await AuthSettingsService.get();
    return new Response(
      JSON.stringify({ requireAdminApproval: Boolean(settings?.requireAdminApproval) }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
});

