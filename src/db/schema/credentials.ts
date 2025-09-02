import { pgTable, text, boolean, timestamp, uuid, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';
import * as v from 'valibot';

// Enums
export const credentialTypeEnum = pgEnum('credential_type', [
  'oauth_google',
  'oauth_microsoft',
  'smtp',
  'imap',
  'api_key',
  'webhook',
  'database',
  'storage'
]);

export const credentialProviderEnum = pgEnum('credential_provider', [
  'google',
  'microsoft',
  'aws',
  'azure',
  'sendgrid',
  'mailgun',
  'custom'
]);

// Credentials table - stores universal credentials for various services
export const credentials = pgTable(
  'credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Credential Information
    name: text('name').notNull(),
    type: credentialTypeEnum('type').notNull(),
    provider: credentialProviderEnum('provider').notNull(),

    // Authentication Data (encrypted)
    clientId: text('client_id'),
    clientSecret: text('client_secret'),
    apiKey: text('api_key'),
    username: text('username'),
    password: text('password'),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiry: timestamp('token_expiry'),

    // Provider-specific fields
    tenantId: text('tenant_id'), // For Microsoft/Azure
    projectId: text('project_id'), // For Google Cloud
    region: text('region'), // For AWS/Azure
    endpoint: text('endpoint'), // Custom endpoints

    // Configuration
    config: jsonb('config').$type<{
      scopes?: string[];
      redirectUri?: string;
      additionalFields?: Record<string, any>;
      [key: string]: any;
    }>(),

    // Status and metadata
    isActive: boolean('is_active').default(true),
    isDefault: boolean('is_default').default(false),
    description: text('description'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index('credentials_type_idx').on(table.type),
    providerIdx: index('credentials_provider_idx').on(table.provider),
    activeIdx: index('credentials_active_idx').on(table.isActive),
    defaultIdx: index('credentials_default_idx').on(table.isDefault),
  })
);

// Validation schemas
export const insertCredentialSchema = createInsertSchema(credentials, {
  name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
  type: v.picklist([
    'oauth_google',
    'oauth_microsoft',
    'smtp',
    'imap',
    'api_key',
    'webhook',
    'database',
    'storage'
  ]),
  provider: v.picklist([
    'google',
    'microsoft',
    'aws',
    'azure',
    'sendgrid',
    'mailgun',
    'custom'
  ]),
  description: v.optional(v.string()),
});

export const selectCredentialSchema = createSelectSchema(credentials);
export const updateCredentialSchema = v.partial(insertCredentialSchema);

// Types
export type Credential = typeof credentials.$inferSelect;
export type NewCredential = typeof credentials.$inferInsert;
export type UpdateCredential = v.InferInput<typeof updateCredentialSchema>;

// Credential types
export type CredentialType = 'oauth_google' | 'oauth_microsoft' | 'smtp' | 'imap' | 'api_key' | 'webhook' | 'database' | 'storage';
export type CredentialProvider = 'google' | 'microsoft' | 'aws' | 'azure' | 'sendgrid' | 'mailgun' | 'custom';