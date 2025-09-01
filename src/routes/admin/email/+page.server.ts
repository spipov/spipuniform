import { EmailService } from '@/lib/services/email/email-service';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  try {
    const [activeSettings, allSettings, templates, logs] = await Promise.all([
      EmailService.getActiveSettings(),
      EmailService.getAllSettings(),
      EmailService.getAllTemplates(),
      EmailService.getEmailLogs(20, 0)
    ]);

    return {
      activeSettings,
      allSettings,
      templates,
      logs
    };
  } catch (error) {
    console.error('Error loading email data:', error);
    return {
      activeSettings: null,
      allSettings: [],
      templates: [],
      logs: []
    };
  }
};

export const actions: Actions = {
  // Email Settings Actions
  createSettings: async ({ request }) => {
    try {
      const formData = await request.formData();
      
      const settingsData = {
        provider: formData.get('provider') as 'smtp' | 'microsoft365' | 'google_workspace',
        fromName: formData.get('fromName') as string,
        fromEmail: formData.get('fromEmail') as string,
        replyToEmail: formData.get('replyToEmail') as string,
        smtpHost: formData.get('smtpHost') as string,
        smtpPort: formData.get('smtpPort') as string,
        smtpUser: formData.get('smtpUser') as string,
        smtpPassword: formData.get('smtpPassword') as string,
        smtpSecure: formData.get('smtpSecure') === 'true',
        clientId: formData.get('clientId') as string,
        clientSecret: formData.get('clientSecret') as string,
        refreshToken: formData.get('refreshToken') as string,
        accessToken: formData.get('accessToken') as string,
        isActive: formData.get('isActive') === 'true'
      };
      
      await EmailService.createSettings(settingsData);
      
      return {
        success: true,
        message: 'Email settings created successfully'
      };
    } catch (error) {
      console.error('Error creating email settings:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to create email settings'
      });
    }
  },

  updateSettings: async ({ request }) => {
    try {
      const formData = await request.formData();
      const id = formData.get('id') as string;
      
      const settingsData = {
        provider: formData.get('provider') as 'smtp' | 'microsoft365' | 'google_workspace',
        fromName: formData.get('fromName') as string,
        fromEmail: formData.get('fromEmail') as string,
        replyToEmail: formData.get('replyToEmail') as string,
        smtpHost: formData.get('smtpHost') as string,
        smtpPort: formData.get('smtpPort') as string,
        smtpUser: formData.get('smtpUser') as string,
        smtpPassword: formData.get('smtpPassword') as string,
        smtpSecure: formData.get('smtpSecure') === 'true',
        clientId: formData.get('clientId') as string,
        clientSecret: formData.get('clientSecret') as string,
        refreshToken: formData.get('refreshToken') as string,
        accessToken: formData.get('accessToken') as string,
        isActive: formData.get('isActive') === 'true'
      };
      
      await EmailService.updateSettings(id, settingsData);
      
      return {
        success: true,
        message: 'Email settings updated successfully'
      };
    } catch (error) {
      console.error('Error updating email settings:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to update email settings'
      });
    }
  },

  testSettings: async ({ request }) => {
    try {
      const formData = await request.formData();
      const id = formData.get('id') as string;
      
      const result = await EmailService.testEmailConfiguration(id);
      
      if (result.success) {
        return {
          success: true,
          message: 'Email configuration test successful'
        };
      } else {
        return fail(400, {
          error: result.error || 'Email configuration test failed'
        });
      }
    } catch (error) {
      console.error('Error testing email settings:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to test email settings'
      });
    }
  },

  // Email Template Actions
  createTemplate: async ({ request }) => {
    try {
      const formData = await request.formData();
      
      const templateData = {
        name: formData.get('name') as string,
        subject: formData.get('subject') as string,
        htmlContent: formData.get('htmlContent') as string,
        textContent: formData.get('textContent') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        variables: JSON.parse(formData.get('variables') as string || '[]'),
        useBranding: formData.get('useBranding') === 'true',
        isActive: formData.get('isActive') === 'true'
      };
      
      await EmailService.createTemplate(templateData);
      
      return {
        success: true,
        message: 'Email template created successfully'
      };
    } catch (error) {
      console.error('Error creating email template:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to create email template'
      });
    }
  },

  updateTemplate: async ({ request }) => {
    try {
      const formData = await request.formData();
      const id = formData.get('id') as string;
      
      const templateData = {
        name: formData.get('name') as string,
        subject: formData.get('subject') as string,
        htmlContent: formData.get('htmlContent') as string,
        textContent: formData.get('textContent') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        variables: JSON.parse(formData.get('variables') as string || '[]'),
        useBranding: formData.get('useBranding') === 'true',
        isActive: formData.get('isActive') === 'true'
      };
      
      await EmailService.updateTemplate(id, templateData);
      
      return {
        success: true,
        message: 'Email template updated successfully'
      };
    } catch (error) {
      console.error('Error updating email template:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to update email template'
      });
    }
  },

  // Send Test Email
  sendTestEmail: async ({ request }) => {
    try {
      const formData = await request.formData();
      const templateId = formData.get('templateId') as string;
      const testEmail = formData.get('testEmail') as string;
      const variables = JSON.parse(formData.get('variables') as string || '{}');
      
      const result = await EmailService.sendEmail({
        to: testEmail,
        subject: 'Test Email',
        templateId,
        variables
      });
      
      if (result.success) {
        return {
          success: true,
          message: 'Test email sent successfully',
          messageId: result.messageId
        };
      } else {
        return fail(400, {
          error: result.error || 'Failed to send test email'
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to send test email'
      });
    }
  },

  // Send Custom Email
  sendCustomEmail: async ({ request }) => {
    try {
      const formData = await request.formData();
      
      const result = await EmailService.sendEmail({
        to: formData.get('to') as string,
        subject: formData.get('subject') as string,
        htmlContent: formData.get('htmlContent') as string,
        textContent: formData.get('textContent') as string,
        from: formData.get('from') as string,
        replyTo: formData.get('replyTo') as string
      });
      
      if (result.success) {
        return {
          success: true,
          message: 'Email sent successfully',
          messageId: result.messageId
        };
      } else {
        return fail(400, {
          error: result.error || 'Failed to send email'
        });
      }
    } catch (error) {
      console.error('Error sending custom email:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to send email'
      });
    }
  }
};