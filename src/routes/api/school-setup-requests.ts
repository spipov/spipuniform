import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { schoolSetupRequests } from '@/db/schema/school-setup-requests';
import { schools, user } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { EmailService } from '@/lib/services/email/email-service';
import { auth } from '@/lib/auth';

// In-memory storage for when database table doesn't exist
const inMemoryRequests: any[] = [];

// Validation schema for school setup request
const schoolSetupRequestSchema = z.object({
  countyId: z.string().uuid(),
  localityId: z.string().min(1), // Can be UUID or OSM ID like "osm_123"
  schoolType: z.enum(['primary', 'secondary']),
  selectedSchoolId: z.union([z.string().min(1), z.null()]).optional(), // Allow null or any non-empty string
  customSchoolName: z.union([z.string(), z.null()]).optional(), // Allow null or string
}).refine(
  (data) => {
    // Either selectedSchoolId or customSchoolName must be provided
    return (data.selectedSchoolId && data.selectedSchoolId.trim() !== '') ||
           (data.customSchoolName && data.customSchoolName.trim() !== '');
  },
  {
    message: "Either selectedSchoolId or customSchoolName must be provided",
    path: ["selectedSchoolId"], // This will be checked if the refinement fails
  }
);

export const ServerRoute = createServerFileRoute('/api/school-setup-requests').methods({
  GET: async ({ request }) => {
    try {
      // Try to get school setup requests from database first
      let requests: any[] = [];

      try {
        requests = await db
          .select()
          .from(schoolSetupRequests)
          .orderBy(desc(schoolSetupRequests.createdAt));
      } catch (dbError) {
        console.warn('Database query failed for school setup requests, using in-memory storage:', dbError);
        // Fall back to in-memory storage
        requests = [...inMemoryRequests].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      return new Response(JSON.stringify({
        success: true,
        requests
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching school setup requests:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch school setup requests'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  POST: async ({ request }) => {
    try {
      // Require authenticated user
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
      const userId = session.user.id;

      const body = await request.json();
      const validatedData = schoolSetupRequestSchema.parse(body);

      // Check if this is a CSV school or manual school
      const isCsvSchool = !validatedData.customSchoolName && validatedData.selectedSchoolId;
      const isManualSchool = validatedData.customSchoolName && !validatedData.selectedSchoolId;

      if (isCsvSchool && validatedData.selectedSchoolId) {
        // CSV School: Auto-activate immediately
        try {
          // Update the school to be active
          const [updatedSchool] = await db
            .update(schools)
            .set({
              isActive: true,
              updatedAt: new Date().toISOString()
            })
            .where(eq(schools.id, validatedData.selectedSchoolId!))
            .returning();

          if (updatedSchool) {
            // Send confirmation email
            try {
              await EmailService.sendEmail({
                to: 'user@example.com', // TODO: Get from session
                subject: 'School Activated Successfully',
                template: 'Parent School Setup Request Confirmation',
                variables: {
                  userName: 'User', // TODO: Get from session
                  schoolName: updatedSchool.name,
                  schoolType: updatedSchool.level,
                  localityName: 'Locality', // TODO: Get from locality data
                  countyName: 'County', // TODO: Get from county data
                  requestId: 'auto-activated',
                  requestDate: new Date().toISOString(),
                  siteName: 'SpipUniform',
                  supportEmail: 'support@spipuniform.com'
                }
              });
            } catch (emailError) {
              console.warn('Failed to send confirmation email:', emailError);
            }

            return new Response(JSON.stringify({
              success: true,
              school: updatedSchool,
              action: 'activated',
              message: 'School has been activated and is now available in the marketplace!'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          } else {
            // Fallback: Create request for admin approval
            console.warn('Failed to auto-activate school, creating approval request');
          }
        } catch (dbError) {
          console.error('Failed to activate CSV school:', dbError);
          // Fallback: Create request for admin approval
        }
      }

      if (isManualSchool || isCsvSchool) {
        // Manual School or CSV School (fallback): Create setup request for admin approval
        // If localityId is not a UUID (e.g., OSM id like "osm_123"), skip DB and store in-memory
        const localityIsUuid = z.string().uuid().safeParse(validatedData.localityId).success;
        if (!localityIsUuid) {
          const mockRequest = {
            id: 'mock-osm-' + Date.now(),
            userId,
            countyId: validatedData.countyId,
            localityId: validatedData.localityId,
            schoolType: validatedData.schoolType,
            selectedSchoolId: validatedData.selectedSchoolId || null,
            customSchoolName: validatedData.customSchoolName || null,
            status: 'pending',
            createdAt: new Date().toISOString(),
          };
          inMemoryRequests.unshift(mockRequest);

          // Try to notify admin even for in-memory cases
          try {
            const settings = await EmailService.getActiveSettings();
            const adminEmail = settings?.fromEmail;
            if (adminEmail) {
              await EmailService.sendEmail({
                to: adminEmail,
                subject: 'New School Setup Request (OSM locality)',
                htmlContent: `
                  <p>A new school setup request was submitted using an OSM locality (not yet in DB).</p>
                  <ul>
                    <li><strong>Type:</strong> ${validatedData.schoolType}</li>
                    <li><strong>County ID:</strong> ${validatedData.countyId}</li>
                    <li><strong>Locality:</strong> ${validatedData.localityId}</li>
                    <li><strong>Selected School ID:</strong> ${validatedData.selectedSchoolId || 'N/A'}</li>
                    <li><strong>Custom School Name:</strong> ${validatedData.customSchoolName || 'N/A'}</li>
                    <li><strong>Status:</strong> pending (in-memory)</li>
                    <li><strong>Request ID:</strong> ${mockRequest.id}</li>
                  </ul>
                `
              });
            }
          } catch {}

          return new Response(JSON.stringify({
            success: true,
            request: mockRequest,
            action: 'submitted_for_approval',
            message: 'Request submitted and queued for admin (using OSM locality).',
            note: 'Stored in-memory because locality is not in DB yet'
          }), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }

        try {
          const [newRequest] = await db
            .insert(schoolSetupRequests)
            .values({
              userId,
              countyId: validatedData.countyId,
              localityId: validatedData.localityId,
              schoolType: validatedData.schoolType,
              selectedSchoolId: validatedData.selectedSchoolId || null,
              customSchoolName: validatedData.customSchoolName || null,
              status: 'pending',
            })
            .returning();

          // Notify admin about the new setup request
          try {
            const settings = await EmailService.getActiveSettings();
            const adminEmail = settings?.fromEmail;
            if (adminEmail) {
              await EmailService.sendEmail({
                to: adminEmail,
                subject: 'New School Setup Request',
                htmlContent: `
                  <p>A new school setup request has been submitted.</p>
                  <ul>
                    <li><strong>Type:</strong> ${validatedData.schoolType}</li>
                    <li><strong>County ID:</strong> ${validatedData.countyId}</li>
                    <li><strong>Locality ID:</strong> ${validatedData.localityId}</li>
                    <li><strong>Selected School ID:</strong> ${validatedData.selectedSchoolId || 'N/A'}</li>
                    <li><strong>Custom School Name:</strong> ${validatedData.customSchoolName || 'N/A'}</li>
                    <li><strong>Status:</strong> pending</li>
                    <li><strong>Request ID:</strong> ${newRequest.id}</li>
                  </ul>
                `
              });
            }
          } catch (emailErr) {
            console.warn('Failed to send admin notification for school setup request:', emailErr);
          }

          return new Response(JSON.stringify({
            success: true,
            request: newRequest,
            action: 'submitted_for_approval',
            message: isManualSchool
              ? 'Your school request has been submitted for admin approval. You\'ll be notified once it\'s approved.'
              : 'Unable to auto-activate school. Request submitted for admin approval.'
          }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          });

        } catch (dbError) {
          // Handle missing table gracefully
          const isTableNotFound = dbError && typeof dbError === 'object' && 'code' in dbError &&
                                 (dbError as any).code === '42P01';

          if (isTableNotFound) {
            console.warn('School setup requests table does not exist, saving in-memory and returning mock response');

            // Create and store a mock request in memory so Admin can see it
            const mockRequest = {
              id: 'mock-' + Date.now(),
              userId,
              countyId: validatedData.countyId,
              localityId: validatedData.localityId,
              schoolType: validatedData.schoolType,
              selectedSchoolId: validatedData.selectedSchoolId,
              customSchoolName: validatedData.customSchoolName,
              status: 'pending',
              createdAt: new Date().toISOString(),
            };
            inMemoryRequests.unshift(mockRequest);

            // Try to notify admin even when DB table is missing
            try {
              const settings = await EmailService.getActiveSettings();
              const adminEmail = settings?.fromEmail;
              if (adminEmail) {
                await EmailService.sendEmail({
                  to: adminEmail,
                  subject: 'New School Setup Request (in-memory)',
                  htmlContent: `
                    <p>A new school setup request has been saved in-memory (DB table missing).</p>
                    <ul>
                      <li><strong>Type:</strong> ${validatedData.schoolType}</li>
                      <li><strong>County ID:</strong> ${validatedData.countyId}</li>
                      <li><strong>Locality:</strong> ${validatedData.localityId}</li>
                      <li><strong>Selected School ID:</strong> ${validatedData.selectedSchoolId || 'N/A'}</li>
                      <li><strong>Custom School Name:</strong> ${validatedData.customSchoolName || 'N/A'}</li>
                      <li><strong>Status:</strong> pending (in-memory)</li>
                      <li><strong>Request ID:</strong> ${mockRequest.id}</li>
                    </ul>
                  `
                });
              }
            } catch {}

            return new Response(JSON.stringify({
              success: true,
              request: mockRequest,
              action: 'submitted_for_approval',
              message: isManualSchool
                ? 'Your school request has been submitted for admin approval. You\'ll be notified once it\'s approved.'
                : 'Unable to auto-activate school. Request submitted for admin approval.',
              note: 'Request saved locally - database table not available'
            }), {
              status: 201,
              headers: { 'Content-Type': 'application/json' }
            });
          } else {
            console.error('Database error creating school setup request:', dbError);
            // Don't throw the error, return a fallback response and store in memory
            const mockRequest = {
              id: 'error-' + Date.now(),
              userId,
              countyId: validatedData.countyId,
              localityId: validatedData.localityId,
              schoolType: validatedData.schoolType,
              selectedSchoolId: validatedData.selectedSchoolId,
              customSchoolName: validatedData.customSchoolName,
              status: 'pending',
              createdAt: new Date().toISOString(),
            };
            inMemoryRequests.unshift(mockRequest);

            return new Response(JSON.stringify({
              success: true,
              request: mockRequest,
              action: 'submitted_for_approval',
              message: 'Request submitted (database temporarily unavailable).',
              note: 'Request saved locally - database error occurred'
            }), {
              status: 201,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      }

      // Fallback for edge cases
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid school selection. Please select a school from the list or enter a custom school name.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error creating school setup request:', error);
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create school setup request'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  PUT: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ success: false, error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Require authenticated reviewer
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }

      const body = await request.json().catch(() => ({}));
      const action = body.action as 'approve' | 'deny';
      const adminNotes = (body.adminNotes as string) || null;
      const denialReason = (body.denialReason as string) || null;
      const nextSteps = (body.nextSteps as string) || null;

      if (!action || (action !== 'approve' && action !== 'deny')) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Try to load the request from DB
      let reqRow: any | null = null;
      let dbAvailable = true;
      try {
        const rows = await db
          .select()
          .from(schoolSetupRequests)
          .where(eq(schoolSetupRequests.id, id))
          .limit(1);
        reqRow = rows[0] || null;
      } catch (e) {
        dbAvailable = false;
      }

      // Fallback to in-memory when DB missing or not found
      if (!reqRow) {
        const memIdx = inMemoryRequests.findIndex((r) => r.id === id);
        if (memIdx !== -1) {
          const memReq = inMemoryRequests[memIdx];
          memReq.status = action === 'approve' ? 'approved' : 'denied';
          memReq.reviewedBy = session.user.id;
          memReq.reviewedAt = new Date().toISOString();
          memReq.adminNotes = adminNotes;
          if (action === 'deny') {
            memReq.denialReason = denialReason;
            memReq.nextSteps = nextSteps;
          }
          return new Response(JSON.stringify({ success: true, request: memReq, note: dbAvailable ? 'Request not found in DB, updated in-memory' : 'DB unavailable, updated in-memory' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (!dbAvailable) {
          return new Response(JSON.stringify({ success: false, error: 'Database unavailable and request not found in memory' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: false, error: 'Request not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      // If approving, either activate existing school or create a new one
      let processedSchool: any | null = null;
      if (action === 'approve') {
        if (reqRow.selectedSchoolId) {
          // Activate existing CSV school
          const [updatedSchool] = await db
            .update(schools)
            .set({ isActive: true, updatedAt: new Date().toISOString() })
            .where(eq(schools.id, reqRow.selectedSchoolId))
            .returning();
          processedSchool = updatedSchool || null;
        } else if (reqRow.customSchoolName) {
          // Create a new school entry
          const isUuid = z.string().uuid().safeParse(reqRow.localityId).success;
          const insertValues: any = {
            name: reqRow.customSchoolName,
            countyId: reqRow.countyId,
            level: reqRow.schoolType === 'secondary' ? 'secondary' : 'primary',
            isActive: true,
            updatedAt: new Date().toISOString(),
          };
          if (isUuid) insertValues.localityId = reqRow.localityId;

          const [newSchool] = await db.insert(schools).values(insertValues).returning();
          processedSchool = newSchool || null;
        }
      }

      // Update the request status
      const [updatedReq] = await db
        .update(schoolSetupRequests)
        .set({
          status: action === 'approve' ? 'approved' : 'denied',
          reviewedBy: session.user.id,
          reviewedAt: new Date().toISOString(),
          adminNotes,
          denialReason: action === 'deny' ? denialReason : null,
          nextSteps: action === 'deny' ? nextSteps : null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schoolSetupRequests.id, id))
        .returning();

      // Try to notify the requester by email
      try {
        const userRows = await db.select().from(user).where(eq(user.id, updatedReq.userId)).limit(1);
        const toEmail = userRows?.[0]?.email;
        if (toEmail) {
          if (action === 'approve') {
            await EmailService.sendEmail({
              to: toEmail,
              subject: 'Your school setup request has been approved',
              htmlContent: `Your request has been approved.${processedSchool ? ` School "${processedSchool.name}" is now active.` : ''}`,
            });
          } else {
            await EmailService.sendEmail({
              to: toEmail,
              subject: 'Your school setup request has been denied',
              htmlContent: `Your request was denied.${denialReason ? ` Reason: ${denialReason}` : ''}${nextSteps ? ` Next steps: ${nextSteps}` : ''}`,
            });
          }
        }
      } catch {}

      return new Response(JSON.stringify({ success: true, request: updatedReq, school: processedSchool }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error('Error updating school setup request:', error);
      return new Response(JSON.stringify({ success: false, error: 'Failed to update request' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
});
