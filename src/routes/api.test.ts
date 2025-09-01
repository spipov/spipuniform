import { createServerFileRoute } from '@tanstack/react-start/server';

export const ServerRoute = createServerFileRoute('/api/test').methods({
  GET: async ({ request }) => {
    return new Response(JSON.stringify({ message: 'Test API working', timestamp: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
});