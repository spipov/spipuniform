import { createServerFileRoute } from '@tanstack/react-start/server';
import { EmailService } from '@/lib/services/email/email-service';
import { db } from '@/db';
import { emailTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Dev-only helper to create school setup request email templates
export const ServerRoute = createServerFileRoute('/api/email/templates/seed-school-setup').methods({
  POST: async () => {
    try {
      const desired = [
        {
          name: 'Admin School Setup Request Notification',
          subject: 'New School Setup Request - {{schoolName}}',
          jsonContent: {
            type: 'email',
            version: '1.0',
            content: [
              {
                type: 'heading',
                level: 2,
                text: 'New School Setup Request',
                style: { color: '#1f2937' }
              },
              {
                type: 'box',
                backgroundColor: '#f3f4f6',
                padding: '20px',
                borderRadius: '8px',
                margin: '20px 0',
                content: [
                  {
                    type: 'heading',
                    level: 3,
                    text: 'Request Details',
                    style: { marginTop: '0', color: '#374151' }
                  },
                  {
                    type: 'text',
                    text: '<strong>School Name:</strong> {{schoolName}}'
                  },
                  {
                    type: 'text',
                    text: '<strong>School Type:</strong> {{schoolType}}'
                  },
                  {
                    type: 'text',
                    text: '<strong>Location:</strong> {{localityName}}, {{countyName}}'
                  },
                  {
                    type: 'text',
                    text: '<strong>Requested by:</strong> {{userName}} ({{userEmail}})'
                  },
                  {
                    type: 'text',
                    text: '<strong>Request ID:</strong> {{requestId}}'
                  },
                  {
                    type: 'text',
                    text: '<strong>Submitted:</strong> {{requestDate}}'
                  }
                ]
              },
              {
                type: 'box',
                margin: '30px 0',
                content: [
                  {
                    type: 'text',
                    text: '<strong>Action Required:</strong>',
                    style: { marginBottom: '10px' }
                  },
                  {
                    type: 'text',
                    text: 'Please review this school setup request in the admin dashboard:'
                  },
                  {
                    type: 'button',
                    text: 'Review School Setup Request',
                    url: '{{adminDashboardUrl}}/school-setup-requests/{{requestId}}',
                    style: {
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }
                  }
                ]
              },
              {
                type: 'divider',
                style: {
                  border: 'none',
                  borderTop: '1px solid #e5e7eb',
                  margin: '30px 0'
                }
              },
              {
                type: 'text',
                text: 'This email was sent automatically by {{siteName}}.<br>Request submitted: {{requestDate}}',
                style: { color: '#6b7280', fontSize: '14px' }
              }
            ]
          },
          htmlContent: '<div>JSON-based template - rendered dynamically</div>',
          textContent: `
New School Setup Request

Request Details:
- School Name: {{schoolName}}
- School Type: {{schoolType}}
- Location: {{localityName}}, {{countyName}}
- Requested by: {{userName}} ({{userEmail}})
- Request ID: {{requestId}}
- Submitted: {{requestDate}}

Action Required:
Please review this school setup request in the admin dashboard:
{{adminDashboardUrl}}/school-setup-requests/{{requestId}}

Request submitted: {{requestDate}}
          `,
          isActive: true,
        },
        {
          name: 'Parent School Setup Request Confirmation',
          subject: 'School Setup Request Received - {{siteName}}',
          jsonContent: {
            type: 'email',
            version: '1.0',
            content: [
              {
                type: 'heading',
                level: 2,
                text: 'School Setup Request Received',
                style: { color: '#1f2937' }
              },
              {
                type: 'text',
                text: 'Hi {{userName}},'
              },
              {
                type: 'text',
                text: 'Thank you for requesting to add a new school to our marketplace. We\'ve received your request and will review it shortly.'
              },
              {
                type: 'box',
                backgroundColor: '#f0f9ff',
                padding: '20px',
                borderRadius: '8px',
                margin: '20px 0',
                borderLeft: '4px solid #3b82f6',
                content: [
                  {
                    type: 'heading',
                    level: 3,
                    text: 'Your Request',
                    style: { marginTop: '0', color: '#1e40af' }
                  },
                  {
                    type: 'text',
                    text: '<strong>School Name:</strong> {{schoolName}}'
                  },
                  {
                    type: 'text',
                    text: '<strong>School Type:</strong> {{schoolType}}'
                  },
                  {
                    type: 'text',
                    text: '<strong>Location:</strong> {{localityName}}, {{countyName}}'
                  },
                  {
                    type: 'text',
                    text: '<strong>Request ID:</strong> {{requestId}}'
                  },
                  {
                    type: 'text',
                    text: '<strong>Submitted:</strong> {{requestDate}}'
                  }
                ]
              },
              {
                type: 'box',
                backgroundColor: '#fef3c7',
                padding: '15px',
                borderRadius: '6px',
                margin: '20px 0',
                content: [
                  {
                    type: 'text',
                    text: '<strong>⏳ What happens next?</strong><br>Our team will review your request within 2-3 business days. You\'ll receive an email notification once a decision has been made.',
                    style: { margin: '0', color: '#92400e' }
                  }
                ]
              },
              {
                type: 'text',
                text: 'If you have any questions about your request, please don\'t hesitate to contact our support team at {{supportEmail}}.'
              },
              {
                type: 'text',
                text: 'Thank you for helping expand our school marketplace!'
              },
              {
                type: 'text',
                text: 'Best regards,<br>The {{siteName}} Team'
              }
            ]
          },
          htmlContent: '<div>JSON-based template - rendered dynamically</div>',
          textContent: `
Hi {{userName}},

Thank you for requesting to add a new school to our marketplace. We've received your request and will review it shortly.

Your Request:
- School Name: {{schoolName}}
- School Type: {{schoolType}}
- Location: {{localityName}}, {{countyName}}
- Request ID: {{requestId}}
- Submitted: {{requestDate}}

What happens next?
Our team will review your request within 2-3 business days. You'll receive an email notification once a decision has been made.

If you have any questions, please contact our support team at {{supportEmail}}.

Thank you for helping expand our school marketplace!

Best regards,
The {{siteName}} Team
          `,
          isActive: true,
        },
        {
          name: 'Parent School Setup Request Approved',
          subject: 'School Setup Request Approved - {{siteName}}',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">✅ School Setup Request Approved!</h2>

              <p>Hi {{userName}},</p>

              <p>Great news! Your school setup request has been approved and the school has been added to our marketplace.</p>

              <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                <h3 style="margin-top: 0; color: #065f46;">Approved School</h3>
                <p><strong>School Name:</strong> {{schoolName}}</p>
                <p><strong>School Type:</strong> {{schoolType}}</p>
                <p><strong>Location:</strong> {{localityName}}, {{countyName}}</p>
                <p><strong>Approved by:</strong> {{approvedBy}}</p>
                <p><strong>Approved on:</strong> {{approvalDate}}</p>
              </div>

              {{#adminNotes}}
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #374151;">
                  <strong>Admin Notes:</strong><br>
                  {{adminNotes}}
                </p>
              </div>
              {{/adminNotes}}

              <div style="margin: 30px 0;">
                <p>The school is now available in our marketplace for all parents to use:</p>
                <a href="{{siteUrl}}/marketplace/browse"
                   style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Browse Marketplace
                </a>
              </div>

              <p>Thank you for helping expand our school marketplace!</p>

              <p>Best regards,<br>The {{siteName}} Team</p>
            </div>
          `,
          textContent: `
Hi {{userName}},

Great news! Your school setup request has been approved and the school has been added to our marketplace.

Approved School:
- School Name: {{schoolName}}
- School Type: {{schoolType}}
- Location: {{localityName}}, {{countyName}}
- Approved by: {{approvedBy}}
- Approved on: {{approvalDate}}

{{#adminNotes}}
Admin Notes: {{adminNotes}}
{{/adminNotes}}

The school is now available in our marketplace for all parents to use.
Browse the marketplace: {{siteUrl}}/marketplace/browse

Thank you for helping expand our school marketplace!

Best regards,
The {{siteName}} Team
          `,
          isActive: true,
        },
        {
          name: 'Parent School Setup Request Denied',
          subject: 'School Setup Request - Update Required - {{siteName}}',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">School Setup Request Update</h2>

              <p>Hi {{userName}},</p>

              <p>Thank you for your recent school setup request. After careful review, we need some additional information before we can approve adding this school to our marketplace.</p>

              <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <h3 style="margin-top: 0; color: #991b1b;">Request Details</h3>
                <p><strong>School Name:</strong> {{schoolName}}</p>
                <p><strong>School Type:</strong> {{schoolType}}</p>
                <p><strong>Location:</strong> {{localityName}}, {{countyName}}</p>
                <p><strong>Request ID:</strong> {{requestId}}</p>
                <p><strong>Reviewed on:</strong> {{reviewDate}}</p>
              </div>

              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #92400e;">Reason for Review</h3>
                <p>{{denialReason}}</p>
              </div>

              {{#nextSteps}}
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e40af;">Next Steps</h3>
                <p>{{nextSteps}}</p>
              </div>
              {{/nextSteps}}

              <div style="margin: 30px 0;">
                <p>You can submit a new request or contact our support team:</p>
                <a href="{{siteUrl}}/marketplace/browse"
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
                  Browse Marketplace
                </a>
                <a href="mailto:{{supportEmail}}"
                   style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Contact Support
                </a>
              </div>

              <p>We're here to help make this process as smooth as possible.</p>

              <p>Best regards,<br>The {{siteName}} Team</p>
            </div>
          `,
          textContent: `
Hi {{userName}},

Thank you for your recent school setup request. After careful review, we need some additional information before we can approve adding this school to our marketplace.

Request Details:
- School Name: {{schoolName}}
- School Type: {{schoolType}}
- Location: {{localityName}}, {{countyName}}
- Request ID: {{requestId}}
- Reviewed on: {{reviewDate}}

Reason for Review:
{{denialReason}}

{{#nextSteps}}
Next Steps:
{{nextSteps}}
{{/nextSteps}}

You can submit a new request or contact our support team:
- Browse Marketplace: {{siteUrl}}/marketplace/browse
- Contact Support: {{supportEmail}}

We're here to help make this process as smooth as possible.

Best regards,
The {{siteName}} Team
          `,
          isActive: true,
        }
      ];

      for (const t of desired) {
        const exists = await db.select().from(emailTemplates).where(eq(emailTemplates.name, t.name)).limit(1);
        if (!exists[0]) {
          await EmailService.createEmailTemplate({
            name: t.name,
            subject: t.subject,
            htmlContent: t.htmlContent,
            textContent: t.textContent,
            isActive: true,
          } as any);
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error('Seeding school setup templates failed', e);
      return new Response(JSON.stringify({ error: 'Failed to seed templates' }), { status: 500 });
    }
  }
});