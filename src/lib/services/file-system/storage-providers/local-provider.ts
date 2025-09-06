import { BaseStorageProvider, type FileUpload, type UploadResult } from './base-provider';
import * as fs from 'fs/promises';
import * as path from 'path';

export class LocalStorageProvider extends BaseStorageProvider {
  private basePath: string;

  constructor(config: any) {
    super(config);
    this.basePath = config.basePath || './uploads';
    this.ensureDirectory(this.basePath);
  }

  async upload(file: FileUpload, filePath: string): Promise<UploadResult> {
    this.validateFile(file);
    
    const safePath = this.sanitizePath(filePath);
    const fullPath = path.join(this.basePath, safePath);
    const directory = path.dirname(fullPath);
    
    // Ensure directory exists
    await this.ensureDirectory(directory);
    
    // Write file
    await fs.writeFile(fullPath, file.data);
    
    return {
      url: `/uploads/${safePath}`,
      path: safePath,
      size: file.size,
      metadata: {
        fullPath: fullPath,
        directory: directory,
      },
    };
  }

  async delete(filePath: string): Promise<boolean> {
    try {
      const safePath = this.sanitizePath(filePath);
      const fullPath = path.join(this.basePath, safePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async getUrl(filePath: string): Promise<string> {
    const safePath = this.sanitizePath(filePath);
    return `/uploads/${safePath}`;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const safePath = this.sanitizePath(filePath);
      const fullPath = path.join(this.basePath, safePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async move(fromPath: string, toPath: string): Promise<boolean> {
    try {
      const safeFromPath = this.sanitizePath(fromPath);
      const safeToPath = this.sanitizePath(toPath);
      const fullFromPath = path.join(this.basePath, safeFromPath);
      const fullToPath = path.join(this.basePath, safeToPath);
      
      // Ensure target directory exists
      const targetDirectory = path.dirname(fullToPath);
      await this.ensureDirectory(targetDirectory);
      
      await fs.rename(fullFromPath, fullToPath);
      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }

  async copy(fromPath: string, toPath: string): Promise<boolean> {
    try {
      const safeFromPath = this.sanitizePath(fromPath);
      const safeToPath = this.sanitizePath(toPath);
      const fullFromPath = path.join(this.basePath, safeFromPath);
      const fullToPath = path.join(this.basePath, safeToPath);
      
      // Ensure target directory exists
      const targetDirectory = path.dirname(fullToPath);
      await this.ensureDirectory(targetDirectory);
      
      await fs.copyFile(fullFromPath, fullToPath);
      return true;
    } catch (error) {
      console.error('Error copying file:', error);
      return false;
    }
  }

  async list(dirPath: string, options: { recursive?: boolean } = {}): Promise<string[]> {
    try {
      const safePath = this.sanitizePath(dirPath);
      const fullPath = path.join(this.basePath, safePath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const files: string[] = [];

      for (const entry of entries) {
        const entryPath = path.join(safePath, entry.name);
        
        if (entry.isFile()) {
          files.push(entryPath);
        } else if (entry.isDirectory() && options.recursive) {
          const subFiles = await this.list(entryPath, options);
          files.push(...subFiles);
        }
      }

      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async getMetadata(filePath: string): Promise<Record<string, any> | null> {
    try {
      const safePath = this.sanitizePath(filePath);
      const fullPath = path.join(this.basePath, safePath);
      const stats = await fs.stat(fullPath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        permissions: stats.mode,
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
      throw new Error('Failed to create directory');
    }
  }
}