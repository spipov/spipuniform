import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Better Auth tables
export * from './auth';
export { session as sessions } from './auth';

// User Management System tables
export * from './user-management';

// Branding System tables
export * from './branding';

// Email System tables
export * from './email';

// Credentials System tables
export * from './credentials';

// Auth Settings
export * from './auth-settings';

// File System tables
export * from './file-system';


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

// Export types for credentials system
export type {
  Credential,
  NewCredential,
  UpdateCredential,
  CredentialType,
  CredentialProvider
} from './credentials';

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
