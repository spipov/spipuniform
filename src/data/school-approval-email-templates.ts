// School Approval Email Templates
// These templates follow the existing email system pattern and can be inserted into seed data

export const schoolApprovalEmailTemplates = [
  {
    name: 'Admin School Request Notification',
    subject: 'New School Selection Request - {{userName}}',
    type: 'notification' as const,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">New School Selection Request</h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Parent Details</h3>
          <p><strong>Name:</strong> {{userName}}</p>
          <p><strong>Email:</strong> {{userEmail}}</p>
          <p><strong>User ID:</strong> {{userId}}</p>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">Request Details</h3>
          <p><strong>Current Schools:</strong> {{currentSchools}}</p>
          <p><strong>Requested Schools:</strong> {{requestedSchools}}</p>
          <p><strong>Total Schools Requested:</strong> {{totalSchoolCount}}</p>
          <p><strong>Reason:</strong> {{requestReason}}</p>
        </div>

        <div style="margin: 30px 0;">
          <p><strong>Action Required:</strong></p>
          <p>Please review this request in the admin dashboard:</p>
          <a href="{{adminDashboardUrl}}/school-requests/{{requestId}}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Request
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This email was sent automatically by {{siteName}}.<br>
          Request submitted: {{requestDate}}
        </p>
      </div>
    `,
    textContent: `
New School Selection Request

Parent Details:
- Name: {{userName}}
- Email: {{userEmail}}
- User ID: {{userId}}

Request Details:
- Current Schools: {{currentSchools}}
- Requested Schools: {{requestedSchools}}
- Total Schools Requested: {{totalSchoolCount}}
- Reason: {{requestReason}}

Action Required:
Please review this request in the admin dashboard:
{{adminDashboardUrl}}/school-requests/{{requestId}}

Request submitted: {{requestDate}}
`,
    jsonContent: null,
    variables: {
      userName: 'John Doe',
      userEmail: 'john@example.com',
      userId: 'user_123',
      currentSchools: 'St. Mary\'s Primary, Oak View Secondary',
      requestedSchools: 'Riverside Academy, Green Valley School',
      totalSchoolCount: '4',
      requestReason: 'Family moved to new area, children attending multiple schools',
      adminDashboardUrl: '{{siteUrl}}/admin',
      requestId: 'req_456',
      requestDate: '2024-01-15 10:30:00',
      siteName: '{{siteName}}'
    },
    isActive: true
  },

  {
    name: 'Parent School Request Confirmation',
    subject: 'School Selection Request Received - {{siteName}}',
    type: 'notification' as const,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Request Received</h2>
        
        <p>Hi {{userName}},</p>
        
        <p>We've received your request to add additional schools to your profile. Here are the details:</p>

        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e40af;">Your Request</h3>
          <p><strong>Requested Schools:</strong> {{requestedSchools}}</p>
          <p><strong>Total Schools:</strong> {{totalSchoolCount}}</p>
          <p><strong>Request ID:</strong> {{requestId}}</p>
          <p><strong>Submitted:</strong> {{requestDate}}</p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>⏳ What happens next?</strong><br>
            Our team will review your request within 2-3 business days. You'll receive an email notification once a decision has been made.
          </p>
        </div>

        <p>If you have any questions about your request, please don't hesitate to contact our support team at {{supportEmail}}.</p>

        <p>Thank you for using {{siteName}}!</p>
        
        <p>Best regards,<br>The {{siteName}} Team</p>
      </div>
    `,
    textContent: `
Hi {{userName}},

We've received your request to add additional schools to your profile.

Your Request:
- Requested Schools: {{requestedSchools}}
- Total Schools: {{totalSchoolCount}}
- Request ID: {{requestId}}
- Submitted: {{requestDate}}

What happens next?
Our team will review your request within 2-3 business days. You'll receive an email notification once a decision has been made.

If you have any questions, please contact our support team at {{supportEmail}}.

Thank you for using {{siteName}}!

Best regards,
The {{siteName}} Team
    `,
    jsonContent: null,
    variables: {
      userName: 'John Doe',
      requestedSchools: 'Riverside Academy, Green Valley School',
      totalSchoolCount: '4',
      requestId: 'req_456',
      requestDate: '2024-01-15 10:30:00',
      supportEmail: '{{supportEmail}}',
      siteName: '{{siteName}}'
    },
    isActive: true
  },

  {
    name: 'Parent School Request Approved',
    subject: 'School Selection Request Approved - {{siteName}}',
    type: 'notification' as const,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">✅ Request Approved!</h2>
        
        <p>Hi {{userName}},</p>
        
        <p>Great news! Your request to add additional schools has been approved.</p>

        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin-top: 0; color: #065f46;">Approved Schools</h3>
          <p><strong>Added Schools:</strong> {{approvedSchools}}</p>
          <p><strong>Your Total Schools:</strong> {{totalSchoolCount}}</p>
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
          <p>You can now browse and manage uniforms for all your approved schools:</p>
          <a href="{{siteUrl}}/dashboard/profile" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Your Profile
          </a>
        </div>

        <p>Thank you for using {{siteName}}!</p>
        
        <p>Best regards,<br>The {{siteName}} Team</p>
      </div>
    `,
    textContent: `
Hi {{userName}},

Great news! Your request to add additional schools has been approved.

Approved Schools:
- Added Schools: {{approvedSchools}}
- Your Total Schools: {{totalSchoolCount}}
- Approved by: {{approvedBy}}
- Approved on: {{approvalDate}}

{{#adminNotes}}
Admin Notes: {{adminNotes}}
{{/adminNotes}}

You can now browse and manage uniforms for all your approved schools.
Visit your profile: {{siteUrl}}/dashboard/profile

Thank you for using {{siteName}}!

Best regards,
The {{siteName}} Team
    `,
    jsonContent: null,
    variables: {
      userName: 'John Doe',
      approvedSchools: 'Riverside Academy, Green Valley School',
      totalSchoolCount: '4',
      approvedBy: 'Admin Team',
      approvalDate: '2024-01-17 14:45:00',
      adminNotes: 'Request approved as schools are within service area.',
      siteUrl: '{{siteUrl}}',
      siteName: '{{siteName}}'
    },
    isActive: true
  },

  {
    name: 'Parent School Request Denied',
    subject: 'School Selection Request - Update Required - {{siteName}}',
    type: 'notification' as const,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">School Selection Request Update</h2>
        
        <p>Hi {{userName}},</p>
        
        <p>Thank you for your recent school selection request. After careful review, we need some additional information before we can approve your request.</p>

        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #991b1b;">Request Details</h3>
          <p><strong>Requested Schools:</strong> {{requestedSchools}}</p>
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
          <a href="{{siteUrl}}/dashboard/profile" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            Update Profile
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

Thank you for your recent school selection request. After careful review, we need some additional information before we can approve your request.

Request Details:
- Requested Schools: {{requestedSchools}}
- Request ID: {{requestId}}
- Reviewed on: {{reviewDate}}

Reason for Review:
{{denialReason}}

{{#nextSteps}}
Next Steps:
{{nextSteps}}
{{/nextSteps}}

You can submit a new request or contact our support team:
- Update Profile: {{siteUrl}}/dashboard/profile
- Contact Support: {{supportEmail}}

We're here to help make this process as smooth as possible.

Best regards,
The {{siteName}} Team
    `,
    jsonContent: null,
    variables: {
      userName: 'John Doe',
      requestedSchools: 'Riverside Academy, Green Valley School',
      requestId: 'req_456',
      reviewDate: '2024-01-17 14:45:00',
      denialReason: 'The requested schools are outside our current service area. Please provide proof of enrollment or residence documentation.',
      nextSteps: 'Please upload enrollment confirmation or proof of residence documents, then submit a new request.',
      siteUrl: '{{siteUrl}}',
      supportEmail: '{{supportEmail}}',
      siteName: '{{siteName}}'
    },
    isActive: true
  }
];