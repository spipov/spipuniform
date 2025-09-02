import { pgTable, text, boolean, timestamp, uuid, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';
import * as v from 'valibot';

// Enums
export const emailProviderEnum = pgEnum('email_provider', ['smtp', 'microsoft365', 'google_workspace']);
export const emailStatusEnum = pgEnum('email_status', ['pending', 'sent', 'failed', 'delivered', 'bounced']);
export const templateTypeEnum = pgEnum('template_type', ['welcome', 'reset_password', 'verification', 'notification', 'custom']);

// Email Settings table - stores provider configurations
export const emailSettings = pgTable(
  'email_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Provider Configuration
    provider: emailProviderEnum('provider').notNull(),
    isActive: boolean('is_active').default(false),
    
    // SMTP Configuration
    smtpHost: text('smtp_host'),
    smtpPort: text('smtp_port'),
    smtpUser: text('smtp_user'),
    smtpPassword: text('smtp_password'), // Should be encrypted
    smtpSecure: boolean('smtp_secure').default(true),

    // IMAP Configuration
    imapHost: text('imap_host'),
    imapPort: text('imap_port'),
    imapUser: text('imap_user'),
    imapPassword: text('imap_password'), // Should be encrypted
    imapSecure: boolean('imap_secure').default(true),
    
    // OAuth Configuration (for Microsoft 365 / Google Workspace)
    clientId: text('client_id'),
    clientSecret: text('client_secret'), // Should be encrypted
    tenantId: text('tenant_id'), // For Microsoft 365
    refreshToken: text('refresh_token'), // Should be encrypted
    accessToken: text('access_token'), // Should be encrypted
    tokenExpiry: timestamp('token_expiry'),
    
    // Sender Information
    fromName: text('from_name').notNull(),
    fromEmail: text('from_email').notNull(),
    replyToEmail: text('reply_to_email'),
    
    // Configuration Metadata
    configName: text('config_name').notNull(),
    description: text('description'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('email_settings_active_idx').on(table.isActive),
    providerIdx: index('email_settings_provider_idx').on(table.provider),
  })
);

// Email Templates table - stores reusable email templates
export const emailTemplates = pgTable(
  'email_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Template Information
    name: text('name').notNull(),
    type: templateTypeEnum('type').notNull(),
    subject: text('subject').notNull(),
    
    // Template Content
    htmlContent: text('html_content').notNull(),
    textContent: text('text_content'),
    
    // Template Variables (for documentation)
    variables: jsonb('variables').$type<{
      [key: string]: {
        description: string;
        example: string;
        required: boolean;
      };
    }>(),
    
    // Branding Integration
    useBranding: boolean('use_branding').default(true),
    
    // Status
    isActive: boolean('is_active').default(true),
    isDefault: boolean('is_default').default(false),
    
    // Metadata
    description: text('description'),
    version: text('version').default('1.0.0'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index('email_templates_type_idx').on(table.type),
    activeIdx: index('email_templates_active_idx').on(table.isActive),
    defaultIdx: index('email_templates_default_idx').on(table.isDefault),
  })
);

// Email Logs table - tracks all sent emails
export const emailLogs = pgTable(
  'email_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Email Details
    toEmail: text('to_email').notNull(),
    fromEmail: text('from_email').notNull(),
    subject: text('subject').notNull(),
    
    // Template Reference
    templateId: uuid('template_id').references(() => emailTemplates.id),
    templateName: text('template_name'),
    
    // Provider Reference
    settingsId: uuid('settings_id').references(() => emailSettings.id),
    provider: emailProviderEnum('provider').notNull(),
    
    // Status and Tracking
    status: emailStatusEnum('status').default('pending').notNull(),
    messageId: text('message_id'), // Provider message ID
    
    // Error Information
    errorMessage: text('error_message'),
    errorCode: text('error_code'),
    
    // Delivery Information
    sentAt: timestamp('sent_at'),
    deliveredAt: timestamp('delivered_at'),
    
    // Metadata
    metadata: jsonb('metadata').$type<{
      variables?: Record<string, any>;
      userAgent?: string;
      ipAddress?: string;
      userId?: string;
      [key: string]: any;
    }>(),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('email_logs_status_idx').on(table.status),
    toEmailIdx: index('email_logs_to_email_idx').on(table.toEmail),
    providerIdx: index('email_logs_provider_idx').on(table.provider),
    createdAtIdx: index('email_logs_created_at_idx').on(table.createdAt),
    templateIdx: index('email_logs_template_idx').on(table.templateId),
  })
);

// Validation schemas
export const insertEmailSettingsSchema = createInsertSchema(emailSettings, {
  provider: v.picklist(['smtp', 'microsoft365', 'google_workspace']),
  fromName: v.pipe(v.string(), v.minLength(1, 'From name is required')),
  fromEmail: v.pipe(v.string(), v.email('Must be a valid email')),
  replyToEmail: v.optional(v.pipe(v.string(), v.email('Must be a valid email'))),
  configName: v.pipe(v.string(), v.minLength(1, 'Config name is required')),
  smtpHost: v.optional(v.string()),
  smtpPort: v.optional(v.string()),
  smtpUser: v.optional(v.string()),
  smtpPassword: v.optional(v.string()),
  imapHost: v.optional(v.string()),
  imapPort: v.optional(v.string()),
  imapUser: v.optional(v.string()),
  imapPassword: v.optional(v.string()),
  clientId: v.optional(v.string()),
  clientSecret: v.optional(v.string()),
  tenantId: v.optional(v.string()),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates, {
  name: v.pipe(v.string(), v.minLength(1, 'Template name is required')),
  type: v.picklist(['welcome', 'reset_password', 'verification', 'notification', 'custom']),
  subject: v.pipe(v.string(), v.minLength(1, 'Subject is required')),
  htmlContent: v.pipe(v.string(), v.minLength(1, 'HTML content is required')),
  textContent: v.optional(v.string()),
  description: v.optional(v.string()),
  version: v.optional(v.string()),
});

export const insertEmailLogSchema = createInsertSchema(emailLogs, {
  toEmail: v.pipe(v.string(), v.email('Must be a valid email')),
  fromEmail: v.pipe(v.string(), v.email('Must be a valid email')),
  subject: v.pipe(v.string(), v.minLength(1, 'Subject is required')),
  provider: v.picklist(['smtp', 'microsoft365', 'google_workspace']),
  status: v.optional(v.picklist(['pending', 'sent', 'failed', 'delivered', 'bounced'])),
});

// Select schemas
export const selectEmailSettingsSchema = createSelectSchema(emailSettings);
export const selectEmailTemplateSchema = createSelectSchema(emailTemplates);
export const selectEmailLogSchema = createSelectSchema(emailLogs);

// Update schemas
export const updateEmailSettingsSchema = v.partial(insertEmailSettingsSchema);
export const updateEmailTemplateSchema = v.partial(insertEmailTemplateSchema);

// Types
export type EmailSettings = typeof emailSettings.$inferSelect;
export type NewEmailSettings = typeof emailSettings.$inferInsert;
export type UpdateEmailSettings = v.InferInput<typeof updateEmailSettingsSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
export type UpdateEmailTemplate = v.InferInput<typeof updateEmailTemplateSchema>;

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;

// Email provider types
export type EmailProvider = 'smtp' | 'microsoft365' | 'google_workspace';
export type EmailStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced';
export type TemplateType = 'welcome' | 'reset_password' | 'verification' | 'notification' | 'custom';