import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { reports, user, listings, requests } from '@/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Validation schemas
const createReportSchema = z.object({
  listingId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
  reason: z.enum(['spam', 'inappropriate', 'scam', 'harassment', 'fake', 'other']),
  description: z.string().min(10, 'Please provide details about the report')
});

const updateReportSchema = z.object({
  status: z.enum(['open', 'reviewing', 'resolved', 'dismissed']),
  handlerNotes: z.string().optional()
});

export const ServerRoute = createServerFileRoute('/api/reports').methods({
  // Get all reports (admin only)
  GET: async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Admin access required'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const url = new URL(request.url);
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = db
        .select({
          id: reports.id,
          reporterUserId: reports.reporterUserId,
          listingId: reports.listingId,
          requestId: reports.requestId,
          reason: reports.reason,
          description: reports.description,
          status: reports.status,
          createdAt: reports.createdAt,
          updatedAt: reports.updatedAt,
          handledBy: reports.handledBy,
          handlerNotes: reports.handlerNotes,
          // Join with user info
          reporterName: user.name,
          reporterEmail: user.email,
          // Join with listing info if available
          listingTitle: listings.title,
          // Join with request info if available
          requestDescription: requests.description
        })
        .from(reports)
        .leftJoin(user, eq(reports.reporterUserId, user.id))
        .leftJoin(listings, eq(reports.listingId, listings.id))
        .leftJoin(requests, eq(reports.requestId, requests.id))
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset);

      if (status) {
        query = query.where(eq(reports.status, status as any));
      }

      const result = await query;

      return new Response(JSON.stringify({
        success: true,
        reports: result
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch reports'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // Create a new report
  POST: async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const validatedData = createReportSchema.parse(body);

      // Ensure either listingId or requestId is provided
      if (!validatedData.listingId && !validatedData.requestId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Either listingId or requestId must be provided'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if the listing or request exists
      if (validatedData.listingId) {
        const [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, validatedData.listingId))
          .limit(1);

        if (!listing) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Listing not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      if (validatedData.requestId) {
        const [req] = await db
          .select()
          .from(requests)
          .where(eq(requests.id, validatedData.requestId))
          .limit(1);

        if (!req) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Request not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Create the report
      const [newReport] = await db
        .insert(reports)
        .values({
          reporterUserId: session.user.id,
          listingId: validatedData.listingId,
          requestId: validatedData.requestId,
          reason: validatedData.reason,
          description: validatedData.description,
          status: 'open'
        })
        .returning();

      return new Response(JSON.stringify({
        success: true,
        report: newReport,
        message: 'Report submitted successfully'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error creating report:', error);
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid data',
          details: error.errors
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create report'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // Update report status (admin only)
  PUT: async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session || session.user.role !== 'admin') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Admin access required'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const url = new URL(request.url);
      const reportId = url.searchParams.get('id');
      if (!reportId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Report ID is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const validatedData = updateReportSchema.parse(body);

      // Check if report exists
      const [existingReport] = await db
        .select()
        .from(reports)
        .where(eq(reports.id, reportId))
        .limit(1);

      if (!existingReport) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Report not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Update the report
      const [updatedReport] = await db
        .update(reports)
        .set({
          status: validatedData.status,
          handlerNotes: validatedData.handlerNotes,
          handledBy: session.user.id,
          updatedAt: new Date().toISOString()
        })
        .where(eq(reports.id, reportId))
        .returning();

      return new Response(JSON.stringify({
        success: true,
        report: updatedReport,
        message: 'Report updated successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error updating report:', error);
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid data',
          details: error.errors
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update report'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
