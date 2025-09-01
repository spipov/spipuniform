export interface FileUpload {
  name: string;
  data: Buffer | Uint8Array;
  mimeType: string;
  size: number;
}

export interface StorageProviderConfig {
  [key: string]: any;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  metadata?: Record<string, any>;
}

export abstract class BaseStorageProvider {
  protected config: StorageProviderConfig;

  constructor(config: StorageProviderConfig) {
    this.config = config;
  }

  abstract upload(file: FileUpload, path: string): Promise<UploadResult>;
  abstract delete(path: string): Promise<boolean>;
  abstract getUrl(path: string): Promise<string>;
  abstract exists(path: string): Promise<boolean>;
  abstract move(fromPath: string, toPath: string): Promise<boolean>;
  abstract copy(fromPath: string, toPath: string): Promise<boolean>;
  abstract list(path: string, options?: { recursive?: boolean }): Promise<string[]>;
  abstract getMetadata(path: string): Promise<Record<string, any> | null>;

  protected validateFile(file: FileUpload): void {
    const maxFileSize = this.config.maxFileSize || 10 * 1024 * 1024; // 10MB default
    const allowedMimeTypes = this.config.allowedMimeTypes || [];

    if (file.size > maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxFileSize} bytes`);
    }

    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimeType)) {
      throw new Error(`File type ${file.mimeType} is not allowed`);
    }

    if (!file.name || file.name.trim() === '') {
      throw new Error('File name is required');
    }
  }

  protected sanitizePath(path: string): string {
    // Remove leading slashes and normalize path
    return path.replace(/^\/+/, '').replace(/\/+/g, '/');
  }

  protected generateSafeName(originalName: string): string {
    // Remove special characters and spaces, add timestamp for uniqueness
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