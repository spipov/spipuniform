import { db } from '@/db';
import {
  emailSettings,
  emailTemplates,
  emailLogs,
  emailFragments,
  type EmailSettings,
  type EmailTemplate,
  type EmailLog,
  type NewEmailTemplate,
} from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import * as v from 'valibot';
import { updateEmailSettingsSchema, updateEmailTemplateSchema, insertEmailTemplateSchema } from '@/db/schema/email';
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
  static async getAllEmailSettings(): Promise<EmailSettings[]> {
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
   * Get email setting by ID
   */
  static async getEmailSettingById(id: string): Promise<EmailSettings | null> {
    try {
      const result = await db
        .select()
        .from(emailSettings)
        .where(eq(emailSettings.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching email setting:', error);
      throw new Error('Failed to fetch email setting');
    }
  }

  /**
   * Create email settings
   */
  static async createEmailSetting(data: NewEmailSettings): Promise<EmailSettings> {
    try {
      // Data is already validated and cleaned at the API route level
      const validatedData = data;

      // If this is being set as active, deactivate all others first
      if (validatedData.isActive) {
        await EmailService.deactivateAllEmailSettings();
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
  static async updateEmailSetting(id: string, data: UpdateEmailSettings): Promise<EmailSettings> {
    try {
      const validatedData = v.parse(updateEmailSettingsSchema, data);

      // If this is being set as active, deactivate all others first
      if (validatedData.isActive) {
        await EmailService.deactivateAllEmailSettings();
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
   * Activate email setting
   */
  static async activateEmailSetting(id: string): Promise<EmailSettings> {
    try {
      // First deactivate all settings
      await EmailService.deactivateAllEmailSettings();

      // Then activate the specified setting
      const result = await db
        .update(emailSettings)
        .set({
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(emailSettings.id, id))
        .returning();

      if (!result[0]) {
        throw new Error('Email setting not found');
      }

      return result[0];
    } catch (error) {
      console.error('Error activating email setting:', error);
      throw new Error('Failed to activate email setting');
    }
  }

  /**
   * Delete email setting
   */
  static async deleteEmailSetting(id: string): Promise<EmailSettings> {
    try {
      // First delete all associated email logs
      await db
        .delete(emailLogs)
        .where(eq(emailLogs.settingsId, id));

      // Then delete the email setting
      const result = await db
        .delete(emailSettings)
        .where(eq(emailSettings.id, id))
        .returning();

      if (!result[0]) {
        throw new Error('Email setting not found');
      }
      return result[0];
    } catch (error) {
      console.error('Error deleting email setting:', error);
      throw new Error('Failed to delete email setting');
    }
  }

  /**
   * Fragments CRUD
   */
  static async getEmailFragmentById(id: string) {
    const rows = await db.select().from(emailFragments).where(eq(emailFragments.id, id)).limit(1);
    return rows[0] || null;
  }

  static async getAllEmailFragments() {
    return await db.select().from(emailFragments).orderBy(desc(emailFragments.createdAt));
  }

  static async getEmailFragmentsByType(type?: 'base' | 'header' | 'footer' | 'partial') {
    if (!type) return EmailService.getAllEmailFragments();
    // Simple filter client-side after fetch to avoid enum helpers
    const all = await EmailService.getAllEmailFragments();
    return all.filter((f: any) => f.type === type);
  }

  static async createEmailFragment(data: any) {
    const res = await db.insert(emailFragments).values({ ...data, updatedAt: new Date() }).returning();
    return res[0];
  }

  static async updateEmailFragment(id: string, data: any) {
    const res = await db
      .update(emailFragments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emailFragments.id, id))
      .returning();
    return res[0];
  }

  static async deleteEmailFragment(id: string) {
    const res = await db.delete(emailFragments).where(eq(emailFragments.id, id)).returning();
    return res[0];
  }

  /**
   * Deactivate all email settings
   */
  static async deactivateAllEmailSettings(): Promise<void> {
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
  static async getEmailTemplateById(id: string): Promise<EmailTemplate | null> {
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
  static async getAllEmailTemplates(): Promise<EmailTemplate[]> {
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
  static async createEmailTemplate(data: NewEmailTemplate): Promise<EmailTemplate> {
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
  static async updateEmailTemplate(id: string, data: UpdateEmailTemplate): Promise<EmailTemplate> {
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
   * Compose final HTML from base/header/footer fragments and body
   */
  static async composeHtmlFromFragments(
    bodyHtml: string,
    opts: {
      baseFragmentId?: string | null;
      headerFragmentId?: string | null;
      footerFragmentId?: string | null;
      includeHeader?: boolean;
      includeFooter?: boolean;
      variables?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const { baseFragmentId, headerFragmentId, footerFragmentId, includeHeader = true, includeFooter = true } = opts;

    // Fetch fragments if provided
    async function getFragmentHtml(id?: string | null): Promise<string | null> {
      if (!id) return null;
      const rows = await db.select().from(emailFragments).where(eq(emailFragments.id, id)).limit(1);
      const frag = rows[0] as any;
      return frag?.htmlContent || null;
    }

    const [baseHtml, headerHtml, footerHtml] = await Promise.all([
      getFragmentHtml(baseFragmentId || undefined),
      includeHeader ? getFragmentHtml(headerFragmentId || undefined) : Promise.resolve(null),
      includeFooter ? getFragmentHtml(footerFragmentId || undefined) : Promise.resolve(null),
    ]);

    // Simple placeholder replacement
    function applyVars(html: string): string {
      let out = html;
      if (!opts.variables) return out;
      for (const [key, value] of Object.entries(opts.variables)) {
        const re = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        out = out.replace(re, String(value ?? ''));
      }
      return out;
    }

    const h = headerHtml ? applyVars(headerHtml) : '';
    const f = footerHtml ? applyVars(footerHtml) : '';
    const b = applyVars(bodyHtml);

    if (baseHtml) {
      // Replace slots in base: {{header}}, {{content}}, {{footer}}
      let composed = baseHtml;
      composed = composed.replace(/{{\s*header\s*}}/g, h);
      composed = composed.replace(/{{\s*content\s*}}/g, b);
      composed = composed.replace(/{{\s*footer\s*}}/g, f);
      return composed;
    }

    // Fallback: header + body + footer
    return `${h}${b}${f}`;
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

      // Compose with base/header/footer if set
      const composedHtml = await EmailService.composeHtmlFromFragments(htmlContent, {
        baseFragmentId: (template as any).baseFragmentId,
        headerFragmentId: (template as any).headerFragmentId,
        footerFragmentId: (template as any).footerFragmentId,
        includeHeader: (template as any).includeHeader ?? true,
        includeFooter: (template as any).includeFooter ?? true,
        variables,
      });

      return {
        html: composedHtml,
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
          return nodemailer.createTransport({
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
          return nodemailer.createTransport({
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
          return nodemailer.createTransport({
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
      // Get active email settings; if none, fall back to Ethereal dev transport so flows don't 500 in dev
      const settings = await EmailService.getActiveSettings();

      let htmlContent = options.htmlContent || '';
      let textContent = options.textContent || '';
      let subject = options.subject;
      let templateName = '';

      // If template is specified, render it
      if (options.templateId || options.template) {
        let template: EmailTemplate | null = null;

        if (options.templateId) {
          template = await EmailService.getEmailTemplateById(options.templateId);
        } else if (options.template) {
          template = await EmailService.getTemplateByName(options.template);
        }

        if (!template) {
          throw new Error('Email template not found');
        }

        const rendered = await EmailService.renderTemplate(template, options.variables);
        htmlContent = rendered.html;
        textContent = rendered.text;
        subject = rendered.subject;
        templateName = template.name;
      }

      // If no active settings, use Ethereal test account so flows work in dev without SMTP
      if (!settings) {
        const account = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: { user: account.user, pass: account.pass },
        });
        const info = await transporter.sendMail({
          from: `Dev Mail <no-reply@localhost>`,
          to: options.to,
          subject,
          html: htmlContent,
          text: textContent,
        });
        const previewUrl = (nodemailer as any).getTestMessageUrl?.(info);
        if (previewUrl) console.log('[EmailService] Ethereal preview URL:', previewUrl);
        return { success: true, messageId: info.messageId };
      }

      // Create email log entry when we have settings; otherwise we'll use ethereal with no DB log
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
      const transporter = await EmailService.createTransporter(settings);

      // Send email
      const mailOptions: any = {
        from: `${settings.fromName} <${settings.fromEmail}>`,
        to: options.to,
        subject,
        html: htmlContent,
        text: textContent,
      };

      // Only add replyTo if it's provided and not empty
      if (options.replyTo && options.replyTo.trim()) {
        mailOptions.replyTo = options.replyTo;
      } else if (settings.replyToEmail && settings.replyToEmail.trim()) {
        mailOptions.replyTo = settings.replyToEmail;
      }

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
   * Delete email template
   */
  static async deleteEmailTemplate(id: string): Promise<EmailTemplate> {
    try {
      const result = await db
        .delete(emailTemplates)
        .where(eq(emailTemplates.id, id))
        .returning();

      if (!result[0]) {
        throw new Error('Email template not found');
      }

      return result[0];
    } catch (error) {
      console.error('Error deleting email template:', error);
      throw new Error('Failed to delete email template');
    }
  }

  /**
   * Get email log by ID
   */
  static async getEmailLogById(id: string): Promise<EmailLog | null> {
    try {
      const result = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching email log:', error);
      throw new Error('Failed to fetch email log');
    }
  }

  /**
   * Get email logs with pagination and filters
   */
  static async getAllEmailLogs(options: {
    limit?: number;
    offset?: number;
    status?: EmailStatus;
  } = {}): Promise<EmailLog[]> {
    try {
      const { limit = 50, offset = 0, status } = options;

      if (status) {
        return await db
          .select()
          .from(emailLogs)
          .where(eq(emailLogs.status, status))
          .orderBy(desc(emailLogs.createdAt))
          .limit(limit)
          .offset(offset);
      }

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
   * Get email logs with pagination (legacy method)
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

      const transporter = await EmailService.createTransporter(settings[0]);

      // Verify connection
      await transporter.verify();

      // Send test email
      return await EmailService.sendEmail({
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