import { db } from '@/db';
import { files, storageSettings, filePermissions } from '@/db/schema';
import { eq, and, desc, isNull, like } from 'drizzle-orm';
import * as v from 'valibot';
import { insertFileSchema, updateFileSchema, type FileItem, type NewFile, type UpdateFile, type FileWithPermissions, type FileListResponse, type UploadResponse, type UploadError } from '@/db/schema';
import { StorageProviderFactory, type BaseStorageProvider, type FileUpload } from './storage-providers';

export class FileService {
  private static async getActiveStorageProvider(): Promise<{ provider: BaseStorageProvider; settings: any }> {
    const activeSettings = await db
      .select()
      .from(storageSettings)
      .where(eq(storageSettings.isActive, true))
      .limit(1);

    if (!activeSettings[0]) {
      throw new Error('No active storage provider configured');
    }

    const settings = activeSettings[0];
    const config = settings.config || {};
    const provider = StorageProviderFactory.create(settings.provider, config);

    return { provider, settings };
  }

  static async listFiles(path: string = '/', options: {
    page?: number;
    limit?: number;
    type?: 'file' | 'folder';
    userId?: string;
  } = {}): Promise<FileListResponse> {
    try {
      const { page = 1, limit = 50, type, userId } = options;
      const offset = (page - 1) * limit;

      const query = db
        .select()
        .from(files)
        .where(
          and(
            eq(files.path, path),
            eq(files.isDeleted, false),
            type ? eq(files.type, type) : undefined,
            userId ? eq(files.ownerId, userId) : undefined
          )
        )
        .orderBy(desc(files.type), desc(files.createdAt))
        .limit(limit)
        .offset(offset);

      const fileList = await query;

      // Get total count for pagination
      const totalCount = await db
        .select({ count: files.id })
        .from(files)
        .where(
          and(
            eq(files.path, path),
            eq(files.isDeleted, false),
            type ? eq(files.type, type) : undefined,
            userId ? eq(files.ownerId, userId) : undefined
          )
        );

      const total = totalCount.length;
      const hasMore = total > page * limit;

      return {
        files: fileList as FileWithPermissions[],
        totalCount: total,
        hasMore,
        currentPath: path,
      };
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }

  static async getFileById(id: string, userId?: string): Promise<FileWithPermissions | null> {
    try {
      const fileQuery = db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, id),
            eq(files.isDeleted, false),
            userId ? eq(files.ownerId, userId) : undefined
          )
        )
        .limit(1);

      const file = (await fileQuery)[0];
      if (!file) return null;

      // Get permissions if userId is provided
      if (userId) {
        const permissions = await db
          .select()
          .from(filePermissions)
          .where(
            and(
              eq(filePermissions.fileId, id),
              eq(filePermissions.userId, userId)
            )
          );

        return { ...file, permissions } as FileWithPermissions;
      }

      return file as FileWithPermissions;
    } catch (error) {
      console.error('Error getting file by ID:', error);
      throw new Error('Failed to get file');
    }
  }

  static async uploadFiles(fileUploads: FileUpload[], options: {
    path?: string;
    ownerId?: string;
  } = {}): Promise<UploadResponse> {
    const { path = '/', ownerId } = options;
    const uploadedFiles: FileItem[] = [];
    const errors: UploadError[] = [];

    try {
      const { provider, settings } = await FileService.getActiveStorageProvider();

      for (const fileUpload of fileUploads) {
        try {
          // Generate unique filename
          const safeName = FileService.generateSafeName(fileUpload.name);
          
          const filePath = `${path}/${safeName}`.replace(/\/+/g, '/');

          // Upload to storage provider
          const uploadResult = await provider.upload(fileUpload, filePath);

          // Save to database
          const newFile: NewFile = {
            name: safeName,
            path: path,
            type: 'file',
            provider: settings.provider,
            size: fileUpload.size,
            mimeType: fileUpload.mimeType,
            url: uploadResult.url,
            ownerId: ownerId || null,
            metadata: {
              originalName: fileUpload.name,
              uploadedAt: new Date().toISOString(),
              ...uploadResult.metadata,
            },
          };

          const validatedFile = v.parse(insertFileSchema, newFile);
          const result = await db
            .insert(files)
            .values(validatedFile)
            .returning();

          uploadedFiles.push(result[0]);
        } catch (error) {
          console.error(`Error uploading file ${fileUpload.name}:`, error);
          errors.push({
            filename: fileUpload.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return { uploadedFiles, errors };
    } catch (error) {
      console.error('Error in bulk file upload:', error);
      throw new Error('Failed to upload files');
    }
  }

  static async deleteFile(id: string, userId?: string): Promise<boolean> {
    try {
      // Get file first to check permissions and get storage info
      const file = await FileService.getFileById(id, userId);
      if (!file) {
        throw new Error('File not found');
      }

      // If it's a folder, recursively delete all contents first
      if (file.type === 'folder') {
        await FileService.deleteFolderContents(file.path + '/' + file.name, userId);
      }

      // Soft delete in database first
      await db
        .update(files)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(files.id, id));

      // Delete from storage provider (only for files, not folders)
      if (file.type === 'file') {
        try {
          const { provider } = await FileService.getActiveStorageProvider();
          await provider.delete(file.url || '');
        } catch (error) {
          console.error('Error deleting from storage provider:', error);
          // Continue even if storage deletion fails
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  private static async deleteFolderContents(folderPath: string, userId?: string): Promise<void> {
    try {
      // Get all files and folders in this path
      const contents = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.path, folderPath),
            eq(files.isDeleted, false),
            userId ? eq(files.ownerId, userId) : undefined
          )
        );

      // Recursively delete each item
      for (const item of contents) {
        if (item.type === 'folder') {
          // Recursively delete subfolder contents
          await FileService.deleteFolderContents(folderPath + '/' + item.name, userId);
        } else {
          // Delete file from storage
          try {
            const { provider } = await FileService.getActiveStorageProvider();
            await provider.delete(item.url || '');
          } catch (error) {
            console.error(`Error deleting file ${item.name} from storage:`, error);
            // Continue with other files
          }
        }

        // Soft delete item from database
        await db
          .update(files)
          .set({
            isDeleted: true,
            deletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(files.id, item.id));
      }
    } catch (error) {
      console.error('Error deleting folder contents:', error);
      throw new Error('Failed to delete folder contents');
    }
  }

  static async updateFile(id: string, data: UpdateFile, userId?: string): Promise<FileItem> {
    try {
      // Validate input
      const validatedData = v.parse(updateFileSchema, data);

      // Check if file exists and user has permission
      const existing = await FileService.getFileById(id, userId);
      if (!existing) {
        throw new Error('File not found');
      }

      const result = await db
        .update(files)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(files.id, id))
        .returning();

      return result[0];
    } catch (error) {
      if (error instanceof v.ValiError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      console.error('Error updating file:', error);
      throw new Error('Failed to update file');
    }
  }

  static async createFolder(name: string, path: string = '/', ownerId?: string): Promise<FileItem> {
    try {
      const newFolder: NewFile = {
        name,
        path,
        type: 'folder',
        provider: 'local', // Folders are always local
        size: 0,
        ownerId: ownerId || undefined,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      };

      const validatedFolder = v.parse(insertFileSchema, newFolder);
      const result = await db
        .insert(files)
        .values(validatedFolder)
        .returning();

      return result[0];
    } catch (error) {
      if (error instanceof v.ValiError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      console.error('Error creating folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  static async moveFile(id: string, newPath: string, userId?: string): Promise<FileItem> {
    try {
      // Get file first
      const file = await FileService.getFileById(id, userId);
      if (!file) {
        throw new Error('File not found');
      }

      // If it's a file (not folder), update storage provider
      if (file.type === 'file' && file.url) {
        try {
          const { provider } = await FileService.getActiveStorageProvider();
          const oldPath = file.url;
          const newStoragePath = `${newPath}/${file.name}`.replace(/\/+/g, '/');
          await provider.move(oldPath, newStoragePath);
        } catch (error) {
          console.error('Error moving file in storage:', error);
          throw new Error('Failed to move file in storage');
        }
      }

      // Update database
      const result = await db
        .update(files)
        .set({
          path: newPath,
          updatedAt: new Date(),
        })
        .where(eq(files.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error moving file:', error);
      throw new Error('Failed to move file');
    }
  }

  static async searchFiles(query: string, options: {
    path?: string;
    userId?: string;
    type?: 'file' | 'folder';
    limit?: number;
  } = {}): Promise<FileItem[]> {
    try {
      const { path, userId, type, limit = 50 } = options;

      const searchResults = await db
        .select()
        .from(files)
        .where(
          and(
            like(files.name, `%${query}%`),
            eq(files.isDeleted, false),
            path ? eq(files.path, path) : undefined,
            userId ? eq(files.ownerId, userId) : undefined,
            type ? eq(files.type, type) : undefined
          )
        )
        .orderBy(desc(files.createdAt))
        .limit(limit);

      return searchResults;
    } catch (error) {
      console.error('Error searching files:', error);
      throw new Error('Failed to search files');
    }
  }

  private static generateSafeName(originalName: string): string {
    const timestamp = Date.now();
    const cleanName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    
    const nameParts = cleanName.split('.');
    const extension = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
    const baseName = nameParts.join('.');
    
    return `${baseName}_${timestamp}${extension}`;
  }
}

export default FileService;