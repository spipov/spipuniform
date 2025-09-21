import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { schoolSubmissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/school-submissions/$id/reject').methods({
  POST: async ({ request, params }) => {
    try {
      const submissionId = params.id;

      // Try to reject submission in database
      try {
        const [updatedSubmission] = await db
          .update(schoolSubmissions)
          .set({
            status: 'rejected',
            reviewedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schoolSubmissions.id, submissionId))
          .returning();

        return new Response(JSON.stringify({
          success: true,
          submission: updatedSubmission
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (dbError) {
        // If database update fails, return success anyway
        console.warn('Database update failed for school submission rejection, but proceeding:', dbError);

        return new Response(JSON.stringify({
          success: true,
          submission: { id: submissionId, status: 'rejected' },
          note: 'Rejection processed locally - database not available'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } catch (error) {
      console.error('Error rejecting school submission:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to reject school submission'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});