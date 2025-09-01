import { pgTable, text, boolean, timestamp, uuid, jsonb, index, pgEnum, bigint } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';
import * as v from 'valibot';
import { users } from '../user-management';

// Enums
export const storageProviderEnum = pgEnum('storage_provider', ['local', 's3', 'pcloud']);
export const fileTypeEnum = pgEnum('file_type', ['file', 'folder']);

// Storage Settings table - manages storage provider configurations
export const storageSettings = pgTable(
  'storage_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Provider Configuration
    provider: storageProviderEnum('provider').notNull(),
    isActive: boolean('is_active').default(false),
    
    // Provider-specific configuration stored as JSON
    config: jsonb('config').$type<{
      // Local storage config
      basePath?: string;
      maxFileSize?: number;
      
      // S3 config
      accessKeyId?: string;
      secretAccessKey?: string;
      region?: string;
      bucket?: string;
      endpoint?: string;
      
      // pCloud config
      clientId?: string;
      clientSecret?: string;
      accessToken?: string;
      refreshToken?: string;
      
      // Common settings
      allowedMimeTypes?: string[];
      maxFilesPerUpload?: number;
      enableThumbnails?: boolean;
    }>().default({}),
    
    // Metadata
    name: text('name').notNull(),
    description: text('description'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('storage_settings_active_idx').on(table.isActive),
    providerIdx: index('storage_settings_provider_idx').on(table.provider),
  })
);

// Files table - tracks all files and folders
export const files = pgTable(
  'files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // File Information
    name: text('name').notNull(),
    path: text('path').notNull().default('/'),
    type: fileTypeEnum('type').notNull(),
    
    // Storage Information
    provider: storageProviderEnum('provider').notNull(),
    size: bigint('size', { mode: 'number' }).default(0),
    mimeType: text('mime_type'),
    url: text('url'),
    
    // File Organization
    parentId: uuid('parent_id').references(() => files.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    
    // File Metadata
    metadata: jsonb('metadata').$type<{
      originalName?: string;
      uploadedAt?: string;
      checksum?: string;
      thumbnailUrl?: string;
      dimensions?: { width: number; height: number };
      duration?: number; // for video/audio files
      [key: string]: any;
    }>(),
    
    // Permissions and Status
    isPublic: boolean('is_public').default(false),
    isDeleted: boolean('is_deleted').default(false),
    deletedAt: timestamp('deleted_at'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    pathIdx: index('files_path_idx').on(table.path),
    parentIdx: index('files_parent_idx').on(table.parentId),
    ownerIdx: index('files_owner_idx').on(table.ownerId),
    typeIdx: index('files_type_idx').on(table.type),
    providerIdx: index('files_provider_idx').on(table.provider),
    pathNameIdx: index('files_path_name_idx').on(table.path, table.name),
    deletedIdx: index('files_deleted_idx').on(table.isDeleted),
  })
);

// File Permissions table - role-based access control for files
export const filePermissions = pgTable(
  'file_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // References
    fileId: uuid('file_id').references(() => files.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    
    // Permissions
    canRead: boolean('can_read').default(false),
    canWrite: boolean('can_write').default(false),
    canDelete: boolean('can_delete').default(false),
    canShare: boolean('can_share').default(false),
    
    // Metadata
    grantedBy: uuid('granted_by').references(() => users.id),
    expiresAt: timestamp('expires_at'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    fileUserIdx: index('file_permissions_file_user_idx').on(table.fileId, table.userId),
    userIdx: index('file_permissions_user_idx').on(table.userId),
    fileIdx: index('file_permissions_file_idx').on(table.fileId),
  })
);

// Validation schemas
export const insertStorageSettingsSchema = createInsertSchema(storageSettings, {
  provider: v.picklist(['local', 's3', 'pcloud']),
  name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
  description: v.optional(v.string()),
  config: v.optional(v.object({})),
});

export const insertFileSchema = createInsertSchema(files, {
  name: v.pipe(v.string(), v.minLength(1, 'File name is required')),
  path: v.pipe(v.string(), v.minLength(1, 'Path is required')),
  type: v.picklist(['file', 'folder']),
  provider: v.picklist(['local', 's3', 'pcloud']),
  size: v.optional(v.number()),
  mimeType: v.optional(v.string()),
  url: v.optional(v.string()),
  parentId: v.optional(v.string()),
  ownerId: v.optional(v.string()),
  metadata: v.optional(v.object({})),
});

export const insertFilePermissionSchema = createInsertSchema(filePermissions, {
  fileId: v.pipe(v.string(), v.uuid('Must be a valid UUID')),
  userId: v.optional(v.pipe(v.string(), v.uuid('Must be a valid UUID'))),
  canRead: v.optional(v.boolean()),
  canWrite: v.optional(v.boolean()),
  canDelete: v.optional(v.boolean()),
  canShare: v.optional(v.boolean()),
});

// Select schemas
export const selectStorageSettingsSchema = createSelectSchema(storageSettings);
export const selectFileSchema = createSelectSchema(files);
export const selectFilePermissionSchema = createSelectSchema(filePermissions);

// Update schemas
export const updateStorageSettingsSchema = v.partial(insertStorageSettingsSchema);
export const updateFileSchema = v.partial(insertFileSchema);
export const updateFilePermissionSchema = v.partial(insertFilePermissionSchema);

// Types
export type StorageSettings = typeof storageSettings.$inferSelect;
export type NewStorageSettings = typeof storageSettings.$inferInsert;
export type UpdateStorageSettings = v.InferInput<typeof updateStorageSettingsSchema>;

export type FileItem = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type UpdateFile = v.InferInput<typeof updateFileSchema>;

export type FilePermission = typeof filePermissions.$inferSelect;
export type NewFilePermission = typeof filePermissions.$inferInsert;
export type UpdateFilePermission = v.InferInput<typeof updateFilePermissionSchema>;

// Utility types
export type StorageProvider = 'local' | 's3' | 'pcloud';
export type FileType = 'file' | 'folder';

export interface FileWithPermissions extends FileItem {
  permissions?: FilePermission[];
}

export interface StorageConfig {
  basePath?: string;
  maxFileSize?: number;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  bucket?: string;
  endpoint?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  allowedMimeTypes?: string[];
  maxFilesPerUpload?: number;
  enableThumbnails?: boolean;
}

// API Response types
export interface FileListResponse {
  files: FileWithPermissions[];
  totalCount: number;
  hasMore: boolean;
  currentPath: string;
}

export interface UploadResponse {
  uploadedFiles: FileItem[];
  errors: UploadError[];
}

export interface UploadError {
  filename: string;
  error: string;
  code?: string;
}