import { createServerFileRoute } from '@tanstack/react-start/server';
import { EmailService } from '@/lib/services/email/email-service';

export const ServerRoute = createServerFileRoute('/api/email/logs').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const searchParams = url.searchParams;
      const endpoint = url.pathname.split('/api/email/logs')[1];

      const pathParts = endpoint.split('/').filter(Boolean);
      const [id] = pathParts;

      if (id) {
        const log = await EmailService.getEmailLogById(id);
        if (!log) {
          return new Response(
            JSON.stringify({ error: 'Email log not found', success: false }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({ data: log, success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);
        const status = searchParams.get('status');

        const allLogs = await EmailService.getAllEmailLogs({
          limit,
          offset,
          status: status as 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced' | undefined
        });
        
        return new Response(JSON.stringify({ data: allLogs, success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch email logs', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});