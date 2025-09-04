import { createServerFileRoute } from '@tanstack/react-start/server';
import { EmailService } from '@/lib/services/email/email-service';

export const ServerRoute = createServerFileRoute('/api/email/templates/preview').methods({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { html, variables, baseFragmentId, headerFragmentId, footerFragmentId, includeHeader = true, includeFooter = true } = body || {};
      if (typeof html !== 'string') {
        return new Response(JSON.stringify({ success: false, error: 'html string required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const composed = await EmailService.composeHtmlFromFragments(html, {
        baseFragmentId, headerFragmentId, footerFragmentId, includeHeader, includeFooter, variables: variables || {}
      });
      return new Response(JSON.stringify({ success: true, html: composed }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error('Preview composition failed:', error);
      return new Response(JSON.stringify({ success: false, error: 'Failed to compose preview' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
});

