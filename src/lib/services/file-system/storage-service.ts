import { db } from '@/db';
import { storageSettings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import * as v from 'valibot';
import { insertStorageSettingsSchema, updateStorageSettingsSchema, type StorageSettings, type NewStorageSettings, type UpdateStorageSettings } from '@/db/schema';

export class StorageService {
  static async getActiveStorageSettings(): Promise<StorageSettings | null> {
    try {
      const result = await db
        .select()
        .from(storageSettings)
        .where(eq(storageSettings.isActive, true))
        .orderBy(desc(storageSettings.createdAt))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching active storage settings:', error);
      throw new Error('Failed to fetch active storage settings');
    }
  }

  static async getAllStorageSettings(): Promise<StorageSettings[]> {
    try {
      return await db
        .select()
        .from(storageSettings)
        .orderBy(desc(storageSettings.createdAt));
    } catch (error) {
      console.error('Error fetching all storage settings:', error);
      throw new Error('Failed to fetch storage settings');
    }
  }

  static async getStorageSettingsById(id: string): Promise<StorageSettings | null> {
    try {
      const result = await db
        .select()
        .from(storageSettings)
        .where(eq(storageSettings.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching storage settings by ID:', error);
      throw new Error('Failed to fetch storage settings');
    }
  }

  static async createStorageSettings(data: NewStorageSettings): Promise<StorageSettings> {
    try {
      // Validate input data
      const validatedData = v.parse(insertStorageSettingsSchema, data);
      
      // If this is being set as active, deactivate all others first
      if (validatedData.isActive) {
        await StorageService.deactivateAllStorageSettings();
      }
      
      const result = await db
        .insert(storageSettings)
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
      console.error('Error creating storage settings:', error);
      throw new Error('Failed to create storage settings');
    }
  }

  static async updateStorageSettings(id: string, data: UpdateStorageSettings): Promise<StorageSettings> {
    try {
      // Validate input data
      const validatedData = v.parse(updateStorageSettingsSchema, data);
      
      // Check if settings exist
      const existing = await StorageService.getStorageSettingsById(id);
      if (!existing) {
        throw new Error('Storage settings not found');
      }
      
      // If this is being set as active, deactivate all others first
      if (validatedData.isActive) {
        await StorageService.deactivateAllStorageSettings();
      }
      
      const result = await db
        .update(storageSettings)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(storageSettings.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      if (error instanceof v.ValiError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      console.error('Error updating storage settings:', error);
      throw new Error('Failed to update storage settings');
    }
  }

  static async deleteStorageSettings(id: string): Promise<boolean> {
    try {
      // Check if settings exist
      const existing = await StorageService.getStorageSettingsById(id);
      if (!existing) {
        throw new Error('Storage settings not found');
      }
      
      // Don't allow deletion of active storage settings
      if (existing.isActive) {
        throw new Error('Cannot delete active storage settings. Please activate another configuration first.');
      }
      
      await db
        .delete(storageSettings)
        .where(eq(storageSettings.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting storage settings:', error);
      throw error;
    }
  }

  static async activateStorageSettings(id: string): Promise<StorageSettings> {
    try {
      // Check if settings exist
      const existing = await StorageService.getStorageSettingsById(id);
      if (!existing) {
        throw new Error('Storage settings not found');
      }
      
      // Deactivate all storage settings
      await StorageService.deactivateAllStorageSettings();
      
      // Activate the specified one
      const result = await db
        .update(storageSettings)
        .set({
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(storageSettings.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error activating storage settings:', error);
      throw new Error('Failed to activate storage settings');
    }
  }

  static async deactivateAllStorageSettings(): Promise<void> {
    try {
      await db
        .update(storageSettings)
        .set({
          isActive: false,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error deactivating all storage settings:', error);
      throw new Error('Failed to deactivate storage settings');
    }
  }

  static async testStorageConnection(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await StorageService.getStorageSettingsById(id);
      if (!settings) {
        return { success: false, message: 'Storage settings not found' };
      }

      // TODO: Implement actual connection testing based on provider
      switch (settings.provider) {
        case 'local':
          return StorageService.testLocalStorage(settings.config);
        case 's3':
          return StorageService.testS3Storage(settings.config);
        case 'pcloud':
          return StorageService.testPCloudStorage(settings.config);
        default:
          return { success: false, message: 'Unsupported storage provider' };
      }
    } catch (error) {
      console.error('Error testing storage connection:', error);
      return { success: false, message: 'Failed to test storage connection' };
    }
  }

  private static async testLocalStorage(config: any): Promise<{ success: boolean; message: string }> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const basePath = config.basePath || './uploads';
      
      // Try to create the directory if it doesn't exist
      await fs.mkdir(basePath, { recursive: true });
      
      // Try to write a test file
      const testFile = path.join(basePath, 'test-connection.txt');
      await fs.writeFile(testFile, 'test');
      
      // Try to read it back
      await fs.readFile(testFile);
      
      // Clean up
      await fs.unlink(testFile);
      
      return { success: true, message: 'Local storage connection successful' };
    } catch (error) {
      return { success: false, message: `Local storage test failed: ${error}` };
    }
  }

  private static async testS3Storage(config: any): Promise<{ success: boolean; message: string }> {
    // TODO: Implement S3 connection testing
    return { success: false, message: 'S3 connection testing not yet implemented' };
  }

  private static async testPCloudStorage(config: any): Promise<{ success: boolean; message: string }> {
    // TODO: Implement pCloud connection testing
    return { success: false, message: 'pCloud connection testing not yet implemented' };
  }

  static async ensureDefaultStorageSettings(): Promise<StorageSettings> {
    try {
      const activeSettings = await StorageService.getActiveStorageSettings();
      
      if (!activeSettings) {
        const defaultSettings: NewStorageSettings = {
          provider: 'local',
          name: 'Local Storage',
          description: 'Default local file storage',
          config: {
            basePath: './uploads',
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedMimeTypes: [
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
              'application/pdf',
              'text/plain',
              'application/json',
            ],
            maxFilesPerUpload: 10,
            enableThumbnails: true,
          },
          isActive: true,
        };
        
        return await StorageService.createStorageSettings(defaultSettings);
      }
      
      return activeSettings;
    } catch (error) {
      console.error('Error ensuring default storage settings:', error);
      throw new Error('Failed to create default storage settings');
    }
  }
}

export default StorageService;