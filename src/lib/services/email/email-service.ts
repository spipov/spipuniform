import { db } from '@/db';
import { 
  emailSettings, 
  emailTemplates, 
  emailLogs,
  type EmailSettings,
  type EmailTemplate,
  type EmailLog,
  type NewEmailSettings,
  type NewEmailTemplate,
  type NewEmailLog,
  type UpdateEmailSettings,
  type UpdateEmailTemplate,
  type EmailProvider,
  type EmailStatus
} from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import * as v from 'valibot';
import { insertEmailSettingsSchema, insertEmailTemplateSchema, insertEmailLogSchema, updateEmailSettingsSchema, updateEmailTemplateSchema } from '@/db/schema/email';
import nodemailer from 'nodemailer';
import { BrandingService } from '../branding/branding-service';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  templateId?: string;
  variables?: Record<string, any>;
  htmlContent?: string;
  textContent?: string;
  from?: string;
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  logId?: string;
}

export class EmailService {
  /**
   * Get active email settings
   */
  static async getActiveSettings(): Promise<EmailSettings | null> {
    try {
      const result = await db
        .select()
        .from(emailSettings)
        .where(eq(emailSettings.isActive, true))
        .orderBy(desc(emailSettings.createdAt))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching active email settings:', error);
      throw new Error('Failed to fetch active email settings');
    }
  }

  /**
   * Get all email settings
   */
  static async getAllSettings(): Promise<EmailSettings[]> {
    try {
      return await db
        .select()
        .from(emailSettings)
        .orderBy(desc(emailSettings.createdAt));
    } catch (error) {
      console.error('Error fetching email settings:', error);
      throw new Error('Failed to fetch email settings');
    }
  }

  /**
   * Create email settings
   */
  static async createSettings(data: NewEmailSettings): Promise<EmailSettings> {
    try {
      const validatedData = v.parse(insertEmailSettingsSchema, data);
      
      // If this is being set as active, deactivate all others first
      if (validatedData.isActive) {
        await this.deactivateAllSettings();
      }
      
      const result = await db
        .insert(emailSettings)
        .values({
          ...validatedData,
          updatedAt: new Date(),
        })
        .returning();
      
      return result[0];
    } catch (error) {
      if (error instanceof v.ValiError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      console.error('Error creating email settings:', error);
      throw new Error('Failed to create email settings');
    }
  }

  /**
   * Update email settings
   */
  static async updateSettings(id: string, data: UpdateEmailSettings): Promise<EmailSettings> {
    try {
      const validatedData = v.parse(updateEmailSettingsSchema, data);
      
      // If this is being set as active, deactivate all others first
      if (validatedData.isActive) {
        await this.deactivateAllSettings();
      }
      
      const result = await db
        .update(emailSettings)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(emailSettings.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      if (error instanceof v.ValiError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      console.error('Error updating email settings:', error);
      throw new Error('Failed to update email settings');
    }
  }

  /**
   * Deactivate all email settings
   */
  static async deactivateAllSettings(): Promise<void> {
    try {
      await db
        .update(emailSettings)
        .set({
          isActive: false,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error deactivating email settings:', error);
      throw new Error('Failed to deactivate email settings');
    }
  }

  /**
   * Get email template by ID
   */
  static async getTemplateById(id: string): Promise<EmailTemplate | null> {
    try {
      const result = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching email template:', error);
      throw new Error('Failed to fetch email template');
    }
  }

  /**
   * Get email template by name
   */
  static async getTemplateByName(name: string): Promise<EmailTemplate | null> {
    try {
      const result = await db
        .select()
        .from(emailTemplates)
        .where(and(
          eq(emailTemplates.name, name),
          eq(emailTemplates.isActive, true)
        ))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching email template by name:', error);
      throw new Error('Failed to fetch email template');
    }
  }

  /**
   * Get all email templates
   */
  static async getAllTemplates(): Promise<EmailTemplate[]> {
    try {
      return await db
        .select()
        .from(emailTemplates)
        .orderBy(desc(emailTemplates.createdAt));
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw new Error('Failed to fetch email templates');
    }
  }

  /**
   * Create email template
   */
  static async createTemplate(data: NewEmailTemplate): Promise<EmailTemplate> {
    try {
      const validatedData = v.parse(insertEmailTemplateSchema, data);
      
      const result = await db
        .insert(emailTemplates)
        .values({
          ...validatedData,
          updatedAt: new Date(),
        })
        .returning();
      
      return result[0];
    } catch (error) {
      if (error instanceof v.ValiError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      console.error('Error creating email template:', error);
      throw new Error('Failed to create email template');
    }
  }

  /**
   * Update email template
   */
  static async updateTemplate(id: string, data: UpdateEmailTemplate): Promise<EmailTemplate> {
    try {
      const validatedData = v.parse(updateEmailTemplateSchema, data);
      
      const result = await db
        .update(emailTemplates)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      if (error instanceof v.ValiError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      console.error('Error updating email template:', error);
      throw new Error('Failed to update email template');
    }
  }

  /**
   * Render template with variables and branding
   */
  static async renderTemplate(
    template: EmailTemplate, 
    variables: Record<string, any> = {}
  ): Promise<{ html: string; text: string; subject: string }> {
    try {
      let htmlContent = template.htmlContent;
      let textContent = template.textContent || '';
      let subject = template.subject;
      
      // Apply branding if enabled
      if (template.useBranding) {
        const branding = await BrandingService.getActiveBranding();
        if (branding) {
          variables.siteName = branding.siteName;
          variables.siteUrl = branding.siteUrl;
          variables.logoUrl = branding.logoUrl;
          variables.supportEmail = branding.supportEmail;
          variables.primaryColor = branding.primaryColor;
          variables.secondaryColor = branding.secondaryColor;
          variables.accentColor = branding.accentColor;
        }
      }
      
      // Replace variables in content
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        htmlContent = htmlContent.replace(placeholder, String(value || ''));
        textContent = textContent.replace(placeholder, String(value || ''));
        subject = subject.replace(placeholder, String(value || ''));
      }
      
      return {
        html: htmlContent,
        text: textContent,
        subject,
      };
    } catch (error) {
      console.error('Error rendering template:', error);
      throw new Error('Failed to render email template');
    }
  }

  /**
   * Create nodemailer transporter based on settings
   */
  static async createTransporter(settings: EmailSettings) {
    try {
      switch (settings.provider) {
        case 'smtp':
          return nodemailer.createTransporter({
            host: settings.smtpHost!,
            port: parseInt(settings.smtpPort || '587'),
            secure: settings.smtpSecure || false,
            auth: {
              user: settings.smtpUser!,
              pass: settings.smtpPassword!,
            },
          });
        
        case 'microsoft365':
          // OAuth2 configuration for Microsoft 365
          return nodemailer.createTransporter({
            service: 'outlook',
            auth: {
              type: 'OAuth2',
              user: settings.fromEmail,
              clientId: settings.clientId!,
              clientSecret: settings.clientSecret!,
              refreshToken: settings.refreshToken!,
              accessToken: settings.accessToken!,
            },
          });
        
        case 'google_workspace':
          // OAuth2 configuration for Google Workspace
          return nodemailer.createTransporter({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: settings.fromEmail,
              clientId: settings.clientId!,
              clientSecret: settings.clientSecret!,
              refreshToken: settings.refreshToken!,
              accessToken: settings.accessToken!,
            },
          });
        
        default:
          throw new Error(`Unsupported email provider: ${settings.provider}`);
      }
    } catch (error) {
      console.error('Error creating transporter:', error);
      throw new Error('Failed to create email transporter');
    }
  }

  /**
   * Send email
   */
  static async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    let logId: string | undefined;
    
    try {
      // Get active email settings
      const settings = await this.getActiveSettings();
      if (!settings) {
        throw new Error('No active email settings found');
      }
      
      let htmlContent = options.htmlContent || '';
      let textContent = options.textContent || '';
      let subject = options.subject;
      let templateName = '';
      
      // If template is specified, render it
      if (options.templateId || options.template) {
        let template: EmailTemplate | null = null;
        
        if (options.templateId) {
          template = await this.getTemplateById(options.templateId);
        } else if (options.template) {
          template = await this.getTemplateByName(options.template);
        }
        
        if (!template) {
          throw new Error('Email template not found');
        }
        
        const rendered = await this.renderTemplate(template, options.variables);
        htmlContent = rendered.html;
        textContent = rendered.text;
        subject = rendered.subject;
        templateName = template.name;
      }
      
      // Create email log entry
      const logData: NewEmailLog = {
        toEmail: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        fromEmail: options.from || settings.fromEmail,
        subject,
        templateId: options.templateId,
        templateName: templateName || undefined,
        settingsId: settings.id,
        provider: settings.provider,
        status: 'pending',
        metadata: {
          variables: options.variables,
        },
      };
      
      const logResult = await db
        .insert(emailLogs)
        .values(logData)
        .returning();
      
      logId = logResult[0].id;
      
      // Create transporter
      const transporter = await this.createTransporter(settings);
      
      // Send email
      const mailOptions = {
        from: `${settings.fromName} <${settings.fromEmail}>`,
        to: options.to,
        subject,
        html: htmlContent,
        text: textContent,
        replyTo: options.replyTo || settings.replyToEmail,
      };
      
      const info = await transporter.sendMail(mailOptions);
      
      // Update log with success
      await db
        .update(emailLogs)
        .set({
          status: 'sent',
          messageId: info.messageId,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailLogs.id, logId));
      
      return {
        success: true,
        messageId: info.messageId,
        logId,
      };
      
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Update log with error if log was created
      if (logId) {
        await db
          .update(emailLogs)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date(),
          })
          .where(eq(emailLogs.id, logId));
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logId,
      };
    }
  }

  /**
   * Get email logs with pagination
   */
  static async getEmailLogs(limit = 50, offset = 0): Promise<EmailLog[]> {
    try {
      return await db
        .select()
        .from(emailLogs)
        .orderBy(desc(emailLogs.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      throw new Error('Failed to fetch email logs');
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(settingsId: string): Promise<EmailResult> {
    try {
      const settings = await db
        .select()
        .from(emailSettings)
        .where(eq(emailSettings.id, settingsId))
        .limit(1);
      
      if (!settings[0]) {
        throw new Error('Email settings not found');
      }
      
      const transporter = await this.createTransporter(settings[0]);
      
      // Verify connection
      await transporter.verify();
      
      // Send test email
      return await this.sendEmail({
        to: settings[0].fromEmail,
        subject: 'Test Email Configuration',
        htmlContent: '<h1>Test Email</h1><p>Your email configuration is working correctly!</p>',
        textContent: 'Test Email\n\nYour email configuration is working correctly!',
      });
      
    } catch (error) {
      console.error('Error testing email configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export for convenience
export default EmailService;