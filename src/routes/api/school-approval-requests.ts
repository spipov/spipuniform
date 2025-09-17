import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { schoolApprovalRequests, userProfiles, schools } from '@/db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { EmailService } from '@/lib/services/email/email-service';

// Validation schema for creating school approval requests
const createSchoolRequestSchema = z.object({
  requestedSchools: z.array(z.string().uuid()).min(1, 'At least one school must be requested').max(10, 'Cannot request more than 10 schools at once'),
  reason: z.string().min(10, 'Please provide a detailed reason (minimum 10 characters)')
});

// Validation schema for admin actions
const adminActionSchema = z.object({
  action: z.enum(['approve', 'deny']),
  adminNotes: z.string().optional(),
  approvedSchools: z.array(z.string().uuid()).optional(), // For partial approvals
  denialReason: z.string().optional(),
  nextSteps: z.string().optional()
});

// Constants
const MAX_SCHOOLS_WITHOUT_APPROVAL = 3;

export const ServerRoute = createServerFileRoute('/api/school-approval-requests').methods({
  GET: async ({ request }) => {
    try {
      // Validate session using Better Auth
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

      const userId = session.user.id;
      const url = new URL(request.url);
      const isAdmin = session.user.role === 'admin'; // Adjust based on your auth system

      if (isAdmin && url.searchParams.get('admin') === 'true') {
        // Admin view: get all pending requests
        const allRequests = await db
          .select()
          .from(schoolApprovalRequests)
          .orderBy(desc(schoolApprovalRequests.createdAt));

        return new Response(JSON.stringify({
          success: true,
          requests: allRequests
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // User view: get their own requests
        const userRequests = await db
          .select()
          .from(schoolApprovalRequests)
          .where(eq(schoolApprovalRequests.userId, userId))
          .orderBy(desc(schoolApprovalRequests.createdAt));

        return new Response(JSON.stringify({
          success: true,
          requests: userRequests
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('Error fetching school approval requests:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch school approval requests'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  POST: async ({ request }) => {
    try {
      // Validate session using Better Auth
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

      const userId = session.user.id;
      const body = await request.json();
      const validatedData = createSchoolRequestSchema.parse(body);

      // Get user's current profile to check existing schools
      const [userProfile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (!userProfile) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User profile not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Calculate current school count
      const currentSchools = [];
      if (userProfile.primarySchoolId) {
        currentSchools.push(userProfile.primarySchoolId);
      }
      if (userProfile.additionalSchools && Array.isArray(userProfile.additionalSchools)) {
        currentSchools.push(...(userProfile.additionalSchools as string[]));
      }

      // Check if user already has pending requests
      const [existingPendingRequest] = await db
        .select()
        .from(schoolApprovalRequests)
        .where(and(
          eq(schoolApprovalRequests.userId, userId),
          eq(schoolApprovalRequests.status, 'pending')
        ))
        .limit(1);

      if (existingPendingRequest) {
        return new Response(JSON.stringify({
          success: false,
          error: 'You already have a pending school approval request. Please wait for it to be processed.'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if the total number of schools would exceed reasonable limits (e.g., 15)
      const totalSchools = currentSchools.length + validatedData.requestedSchools.length;
      if (totalSchools > 15) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Total number of schools cannot exceed 15'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validate that requested schools exist
      const schoolsExist = await db
        .select({ id: schools.id })
        .from(schools)
        .where(inArray(schools.id, validatedData.requestedSchools));

      if (schoolsExist.length !== validatedData.requestedSchools.length) {
        return new Response(JSON.stringify({
          success: false,
          error: 'One or more requested schools do not exist'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create the school approval request
      const [newRequest] = await db
        .insert(schoolApprovalRequests)
        .values({
          userId,
          currentSchools: currentSchools,
          requestedSchools: validatedData.requestedSchools,
          reason: validatedData.reason,
          status: 'pending'
        })
        .returning();

      // Get school names for email content
      const requestedSchoolsData = await db
        .select({ id: schools.id, name: schools.name })
        .from(schools)
        .where(inArray(schools.id, validatedData.requestedSchools));

      const currentSchoolsData = currentSchools.length > 0 ? await db
        .select({ id: schools.id, name: schools.name })
        .from(schools)
        .where(inArray(schools.id, currentSchools)) : [];

      // Send notification emails
      try {
        const userName = session.user.name || session.user.email;
        const userEmail = session.user.email;
        
        const currentSchoolNames = currentSchoolsData.map(s => s.name).join(', ');
        const requestedSchoolNames = requestedSchoolsData.map(s => s.name).join(', ');

        // Send admin notification email
        const adminTemplate = await EmailService.getTemplateByName('Admin School Request Notification');
        if (adminTemplate) {
          await EmailService.sendEmail({
            to: process.env.ADMIN_EMAIL || 'admin@example.com', // Configure this
            templateId: adminTemplate.id,
            variables: {
              userName,
              userEmail,
              userId,
              currentSchools: currentSchoolNames || 'None',
              requestedSchools: requestedSchoolNames,
              totalSchoolCount: totalSchools.toString(),
              requestReason: validatedData.reason,
              adminDashboardUrl: `${process.env.SITE_URL}/admin`,
              requestId: newRequest.id,
              requestDate: new Date().toISOString(),
              siteName: process.env.SITE_NAME || 'SpipUniform'
            }
          });
        }

        // Send confirmation email to user
        const confirmationTemplate = await EmailService.getTemplateByName('Parent School Request Confirmation');
        if (confirmationTemplate) {
          await EmailService.sendEmail({
            to: userEmail,
            templateId: confirmationTemplate.id,
            variables: {
              userName,
              requestedSchools: requestedSchoolNames,
              totalSchoolCount: totalSchools.toString(),
              requestId: newRequest.id,
              requestDate: new Date().toISOString(),
              supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
              siteName: process.env.SITE_NAME || 'SpipUniform'
            }
          });
        }

        // Update email tracking
        await db
          .update(schoolApprovalRequests)
          .set({
            emailsSent: {
              adminNotification: true,
              userConfirmation: true,
              sentAt: new Date().toISOString()
            }
          })
          .where(eq(schoolApprovalRequests.id, newRequest.id));

      } catch (emailError) {
        console.error('Error sending notification emails:', emailError);
        // Continue with the request creation even if email fails
      }

      return new Response(JSON.stringify({
        success: true,
        request: newRequest,
        message: 'School approval request submitted successfully'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error creating school approval request:', error);
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
        error: 'Failed to create school approval request'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  PUT: async ({ request }) => {
    try {
      // Admin-only endpoint for approving/denying requests
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
      const requestId = url.searchParams.get('id');
      if (!requestId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const validatedData = adminActionSchema.parse(body);

      // Get the request
      const [existingRequest] = await db
        .select()
        .from(schoolApprovalRequests)
        .where(eq(schoolApprovalRequests.id, requestId))
        .limit(1);

      if (!existingRequest) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (existingRequest.status !== 'pending') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request has already been processed'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Update the request based on admin action
      const updateData: any = {
        reviewedBy: session.user.id,
        reviewedAt: new Date().toISOString(),
        adminNotes: validatedData.adminNotes,
        updatedAt: new Date().toISOString()
      };

      if (validatedData.action === 'approve') {
        updateData.status = 'approved';
        updateData.approvedSchools = validatedData.approvedSchools || existingRequest.requestedSchools;
        
        // Update user's profile with approved schools
        const [userProfile] = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, existingRequest.userId))
          .limit(1);

        if (userProfile) {
          const currentAdditional = (userProfile.additionalSchools as string[]) || [];
          const newAdditional = [...currentAdditional, ...(updateData.approvedSchools as string[])];
          
          await db
            .update(userProfiles)
            .set({
              additionalSchools: newAdditional,
              updatedAt: new Date().toISOString()
            })
            .where(eq(userProfiles.userId, existingRequest.userId));
        }

      } else if (validatedData.action === 'deny') {
        updateData.status = 'denied';
        updateData.denialReason = validatedData.denialReason;
        updateData.nextSteps = validatedData.nextSteps;
      }

      // Update the request
      const [updatedRequest] = await db
        .update(schoolApprovalRequests)
        .set(updateData)
        .where(eq(schoolApprovalRequests.id, requestId))
        .returning();

      // Send notification email to user
      try {
        const user = await db.select().from(userProfiles).where(eq(userProfiles.userId, existingRequest.userId)).limit(1);
        if (user[0]) {
          // Get school names
          const requestedSchoolIds = existingRequest.requestedSchools as string[];
          const requestedSchoolsData = await db
            .select({ name: schools.name })
            .from(schools)
            .where(inArray(schools.id, requestedSchoolIds));

          const templateName = validatedData.action === 'approve' 
            ? 'Parent School Request Approved' 
            : 'Parent School Request Denied';
            
          const template = await EmailService.getTemplateByName(templateName);
          
          if (template) {
            const baseVariables = {
              userName: session.user.name || session.user.email,
              requestedSchools: requestedSchoolsData.map(s => s.name).join(', '),
              requestId: existingRequest.id,
              siteUrl: process.env.SITE_URL || 'http://localhost:3000',
              siteName: process.env.SITE_NAME || 'SpipUniform'
            };

            let emailVariables = baseVariables;

            if (validatedData.action === 'approve') {
              const approvedSchoolIds = (updateData.approvedSchools as string[]) || [];
              const approvedSchoolsData = await db
                .select({ name: schools.name })
                .from(schools)
                .where(inArray(schools.id, approvedSchoolIds));

              emailVariables = {
                ...baseVariables,
                approvedSchools: approvedSchoolsData.map(s => s.name).join(', '),
                totalSchoolCount: ((existingRequest.currentSchools as string[]).length + approvedSchoolIds.length).toString(),
                approvedBy: session.user.name || 'Admin Team',
                approvalDate: new Date().toISOString(),
                adminNotes: validatedData.adminNotes || ''
              };
            } else {
              emailVariables = {
                ...baseVariables,
                reviewDate: new Date().toISOString(),
                denialReason: validatedData.denialReason || 'No specific reason provided',
                nextSteps: validatedData.nextSteps || '',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
              };
            }

            await EmailService.sendEmail({
              to: session.user.email,
              templateId: template.id,
              variables: emailVariables
            });
          }
        }
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
      }

      return new Response(JSON.stringify({
        success: true,
        request: updatedRequest,
        message: `Request ${validatedData.action}d successfully`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error processing school approval request:', error);
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
        error: 'Failed to process school approval request'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});