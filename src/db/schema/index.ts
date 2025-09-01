import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Better Auth tables
export * from './auth';

// User Management System tables
export * from './user-management';

// Branding System tables
export * from './branding';

// Email System tables
export * from './email';

// File System tables
export * from './file-system';

// Example table (remove if not needed)
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Export types for user management
export type { User, NewUser, Role, NewRole, Permission, NewPermission } from './user-management';

// Export types for branding
export type { Branding, NewBranding, UpdateBranding } from './branding';

// Export types for email system
export type { 
  EmailSettings, 
  NewEmailSettings, 
  UpdateEmailSettings,
  EmailTemplate, 
  NewEmailTemplate, 
  UpdateEmailTemplate,
  EmailLog, 
  NewEmailLog,
  EmailProvider,
  EmailStatus,
  TemplateType
} from './email';

// Export types for file system
export type {
  StorageSettings,
  NewStorageSettings,
  UpdateStorageSettings,
  FileItem,
  NewFile,
  UpdateFile,
  FilePermission,
  NewFilePermission,
  UpdateFilePermission,
  StorageProvider,
  FileType,
  FileWithPermissions,
  StorageConfig,
  FileListResponse,
  UploadResponse,
  UploadError
} from './file-system';
