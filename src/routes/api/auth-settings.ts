import { createServerFileRoute } from '@tanstack/react-start/server';
import { AuthSettingsService } from '@/lib/services/auth-settings-service';

export const ServerRoute = createServerFileRoute('/api/auth-settings').methods({
  GET: async () => {
    const settings = await AuthSettingsService.get();
    return new Response(JSON.stringify({ data: settings, success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
  POST: async ({ request }) => {
    try {
      const { requireAdminApproval } = await request.json();
      const updated = await AuthSettingsService.setRequireApproval(Boolean(requireAdminApproval));
      return new Response(JSON.stringify({ data: updated, success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('Failed to update auth settings', e);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update auth settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});

