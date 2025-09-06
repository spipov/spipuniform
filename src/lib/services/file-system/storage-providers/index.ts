import type { BaseStorageProvider, StorageProviderConfig } from './base-provider';
import { LocalStorageProvider } from './local-provider';
import { S3StorageProvider } from './s3-provider';
import { PCloudStorageProvider } from './pcloud-provider';
import type { StorageProvider } from '@/db/schema';

export * from './base-provider';
export * from './local-provider';
export * from './s3-provider';
export * from './pcloud-provider';

export class StorageProviderFactory {
  static create(provider: StorageProvider, config: StorageProviderConfig): BaseStorageProvider {
    switch (provider) {
      case 'local':
        return new LocalStorageProvider(config);
      case 's3':
        return new S3StorageProvider(config);
      case 'pcloud':
        return new PCloudStorageProvider(config);
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }
}