import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { schoolSubmissions, schools, counties, localities } from '@/db/schema';
import { eq, desc, and, ilike, or, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { EmailService } from '@/lib/services/email/email-service';

// Validation schema for creating school submissions
const createSchoolSubmissionSchema = z.object({
  schoolName: z.string().min(1, 'School name is required').max(100, 'School name must be less than 100 characters'),
  address: z.string().min(1, 'Address is required').max(500, 'Address is too long'),
  countyId: z.string().uuid('Valid county is required'),
  localityId: z.string().uuid().optional(),
  level: z.enum(['primary', 'secondary', 'mixed'], { required_error: 'School level is required' }),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  submissionReason: z.string().min(10, 'Please provide a detailed reason (minimum 10 characters)'),
  additionalNotes: z.string().optional()
});

// Validation schema for admin actions
const adminActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'mark_duplicate']),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  duplicateSchoolId: z.string().uuid().optional()
});

// Helper function to normalize school name for duplicate detection
const normalizeSchoolName = (name: string): string => {
  return name.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
};

// Helper function to create location fingerprint
const createLocationFingerprint = (countyId: string, localityId?: string): string => {
  return localityId ? `${countyId}:${localityId}` : countyId;
};

export const ServerRoute = createServerFileRoute('/api/school-submissions').methods({
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
        // Admin view: get all submissions with pagination
        const status = url.searchParams.get('status');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const conditions = [];
        if (status) {
          conditions.push(eq(schoolSubmissions.status, status as any));
        }

        const submissions = await db
          .select({
            submission: schoolSubmissions,
            county: {
              id: counties.id,
              name: counties.name
            },
            locality: {
              id: localities.id,
              name: localities.name
            }
          })
          .from(schoolSubmissions)
          .leftJoin(counties, eq(schoolSubmissions.countyId, counties.id))
          .leftJoin(localities, eq(schoolSubmissions.localityId, localities.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(schoolSubmissions.createdAt))
          .limit(limit)
          .offset(offset);

        return new Response(JSON.stringify({
          success: true,
          submissions: submissions.map(s => ({
            ...s.submission,
            county: s.county,
            locality: s.locality
          }))
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // User view: get their own submissions
        const userSubmissions = await db
          .select({
            submission: schoolSubmissions,
            county: {
              id: counties.id,
              name: counties.name
            },
            locality: {
              id: localities.id,
              name: localities.name
            }
          })
          .from(schoolSubmissions)
          .leftJoin(counties, eq(schoolSubmissions.countyId, counties.id))
          .leftJoin(localities, eq(schoolSubmissions.localityId, localities.id))
          .where(eq(schoolSubmissions.submittedBy, userId))
          .orderBy(desc(schoolSubmissions.createdAt));

        return new Response(JSON.stringify({
          success: true,
          submissions: userSubmissions.map(s => ({
            ...s.submission,
            county: s.county,
            locality: s.locality
          }))
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('Error fetching school submissions:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch school submissions'
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
      const validatedData = createSchoolSubmissionSchema.parse(body);

      // Normalize school name and create location fingerprint
      const normalizedName = normalizeSchoolName(validatedData.schoolName);
      const locationFingerprint = createLocationFingerprint(validatedData.countyId, validatedData.localityId);

      // Check for potential duplicates in existing schools
      const existingSchools = await db
        .select()
        .from(schools)
        .where(and(
          eq(schools.countyId, validatedData.countyId),
          validatedData.localityId ? eq(schools.localityId, validatedData.localityId) : undefined
        ));

      // Simple duplicate detection based on similar names
      const potentialDuplicate = existingSchools.find(school => {
        const existingNormalized = normalizeSchoolName(school.name);
        return existingNormalized.includes(normalizedName) || normalizedName.includes(existingNormalized);
      });

      if (potentialDuplicate) {
        return new Response(JSON.stringify({
          success: false,
          error: 'A similar school already exists',
          suggestion: {
            schoolId: potentialDuplicate.id,
            schoolName: potentialDuplicate.name,
            message: `We found a similar school: "${potentialDuplicate.name}". Is this the school you're looking for?`
          }
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check for existing submissions with similar names
      const existingSubmissions = await db
        .select()
        .from(schoolSubmissions)
        .where(and(
          eq(schoolSubmissions.normalizedName, normalizedName),
          eq(schoolSubmissions.locationFingerprint, locationFingerprint),
          eq(schoolSubmissions.status, 'pending')
        ));

      if (existingSubmissions.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'A submission for a similar school in this area is already pending review'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create the school submission
      const [newSubmission] = await db
        .insert(schoolSubmissions)
        .values({
          submittedBy: userId,
          schoolName: validatedData.schoolName,
          address: validatedData.address,
          countyId: validatedData.countyId,
          localityId: validatedData.localityId,
          level: validatedData.level,
          website: validatedData.website || null,
          phone: validatedData.phone || null,
          email: validatedData.email || null,
          submissionReason: validatedData.submissionReason,
          additionalNotes: validatedData.additionalNotes || null,
          normalizedName,
          locationFingerprint
        })
        .returning();

      // Send notification emails
      try {
        const userName = session.user.name || session.user.email;
        const userEmail = session.user.email;
        
        // Get county and locality names for email
        const [county] = await db.select().from(counties).where(eq(counties.id, validatedData.countyId)).limit(1);
        const locality = validatedData.localityId 
          ? await db.select().from(localities).where(eq(localities.id, validatedData.localityId)).limit(1).then(r => r[0])
          : null;

        // Send admin notification email
        const adminTemplate = await EmailService.getTemplateByName('Admin School Submission Notification');
        if (adminTemplate) {
          await EmailService.sendEmail({
            to: process.env.ADMIN_EMAIL || 'admin@example.com', // Configure this
            templateId: adminTemplate.id,
            variables: {
              userName,
              userEmail,
              schoolName: validatedData.schoolName,
              schoolAddress: validatedData.address,
              schoolLevel: validatedData.level,
              county: county?.name || 'Unknown',
              locality: locality?.name || 'Not specified',
              submissionReason: validatedData.submissionReason,
              additionalNotes: validatedData.additionalNotes || 'None',
              adminDashboardUrl: `${process.env.SITE_URL}/admin/school-submissions`,
              submissionId: newSubmission.id,
              submissionDate: new Date().toISOString(),
              siteName: process.env.SITE_NAME || 'SpipUniform'
            }
          });
        }

        // Send confirmation email to user
        const confirmationTemplate = await EmailService.getTemplateByName('School Submission Confirmation');
        if (confirmationTemplate) {
          await EmailService.sendEmail({
            to: userEmail,
            templateId: confirmationTemplate.id,
            variables: {
              userName,
              schoolName: validatedData.schoolName,
              schoolAddress: validatedData.address,
              submissionId: newSubmission.id,
              submissionDate: new Date().toISOString(),
              supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
              siteName: process.env.SITE_NAME || 'SpipUniform'
            }
          });
        }

        // Update email tracking
        await db
          .update(schoolSubmissions)
          .set({
            emailsSent: {
              adminNotification: true,
              userConfirmation: true,
              sentAt: new Date().toISOString()
            }
          })
          .where(eq(schoolSubmissions.id, newSubmission.id));

      } catch (emailError) {
        console.error('Error sending notification emails:', emailError);
        // Continue with the submission creation even if email fails
      }

      return new Response(JSON.stringify({
        success: true,
        submission: newSubmission,
        message: 'School submission created successfully and is pending admin review'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error creating school submission:', error);
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
        error: 'Failed to create school submission'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  PUT: async ({ request }) => {
    try {
      // Admin-only endpoint for approving/rejecting submissions
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
      const submissionId = url.searchParams.get('id');
      if (!submissionId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Submission ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const validatedData = adminActionSchema.parse(body);

      // Get the submission
      const [existingSubmission] = await db
        .select()
        .from(schoolSubmissions)
        .where(eq(schoolSubmissions.id, submissionId))
        .limit(1);

      if (!existingSubmission) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Submission not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (existingSubmission.status !== 'pending') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Submission has already been processed'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let updatedSubmission;

      if (validatedData.action === 'approve') {
        // Create the school
        const [newSchool] = await db
          .insert(schools)
          .values({
            name: existingSubmission.schoolName,
            address: existingSubmission.address,
            countyId: existingSubmission.countyId,
            localityId: existingSubmission.localityId,
            level: existingSubmission.level as 'primary' | 'secondary' | 'mixed',
            website: existingSubmission.website,
            phone: existingSubmission.phone,
            email: existingSubmission.email,
            isActive: true
          })
          .returning();

        // Update submission status
        [updatedSubmission] = await db
          .update(schoolSubmissions)
          .set({
            status: 'approved',
            reviewedBy: session.user.id,
            reviewedAt: new Date().toISOString(),
            adminNotes: validatedData.adminNotes,
            createdSchoolId: newSchool.id,
            updatedAt: new Date().toISOString()
          })
          .where(eq(schoolSubmissions.id, submissionId))
          .returning();

      } else if (validatedData.action === 'reject') {
        [updatedSubmission] = await db
          .update(schoolSubmissions)
          .set({
            status: 'rejected',
            reviewedBy: session.user.id,
            reviewedAt: new Date().toISOString(),
            adminNotes: validatedData.adminNotes,
            rejectionReason: validatedData.rejectionReason,
            updatedAt: new Date().toISOString()
          })
          .where(eq(schoolSubmissions.id, submissionId))
          .returning();

      } else if (validatedData.action === 'mark_duplicate') {
        [updatedSubmission] = await db
          .update(schoolSubmissions)
          .set({
            status: 'duplicate',
            reviewedBy: session.user.id,
            reviewedAt: new Date().toISOString(),
            adminNotes: validatedData.adminNotes,
            duplicateSchoolId: validatedData.duplicateSchoolId,
            updatedAt: new Date().toISOString()
          })
          .where(eq(schoolSubmissions.id, submissionId))
          .returning();
      }

      // Send notification email to user
      try {
        const templateName = validatedData.action === 'approve' 
          ? 'School Submission Approved' 
          : validatedData.action === 'reject'
          ? 'School Submission Rejected'
          : 'School Submission Marked Duplicate';
          
        const template = await EmailService.getTemplateByName(templateName);
        
        if (template) {
          const baseVariables = {
            userName: session.user.name || session.user.email,
            schoolName: existingSubmission.schoolName,
            submissionId: existingSubmission.id,
            reviewDate: new Date().toISOString(),
            siteName: process.env.SITE_NAME || 'SpipUniform',
            siteUrl: process.env.SITE_URL || 'http://localhost:3000'
          };

          let emailVariables = baseVariables;

          if (validatedData.action === 'approve') {
            emailVariables = {
              ...baseVariables,
              adminNotes: validatedData.adminNotes || '',
              schoolUrl: `${process.env.SITE_URL}/schools/${updatedSubmission?.createdSchoolId}`
            };
          } else if (validatedData.action === 'reject') {
            emailVariables = {
              ...baseVariables,
              rejectionReason: validatedData.rejectionReason || 'No specific reason provided',
              adminNotes: validatedData.adminNotes || '',
              supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
            };
          } else if (validatedData.action === 'mark_duplicate') {
            const duplicateSchool = validatedData.duplicateSchoolId 
              ? await db.select().from(schools).where(eq(schools.id, validatedData.duplicateSchoolId)).limit(1).then(r => r[0])
              : null;
              
            emailVariables = {
              ...baseVariables,
              duplicateSchoolName: duplicateSchool?.name || 'Unknown',
              duplicateSchoolId: validatedData.duplicateSchoolId || '',
              adminNotes: validatedData.adminNotes || ''
            };
          }

          await EmailService.sendEmail({
            to: session.user.email,
            templateId: template.id,
            variables: emailVariables
          });
        }
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
      }

      return new Response(JSON.stringify({
        success: true,
        submission: updatedSubmission,
        message: `Submission ${validatedData.action}d successfully`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error processing school submission:', error);
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
        error: 'Failed to process school submission'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});