import { db } from '@/db';
import {
  credentials,
  type Credential,
  type NewCredential,
  type UpdateCredential,
  type CredentialType,
  type CredentialProvider
} from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import * as v from 'valibot';
import { insertCredentialSchema, updateCredentialSchema } from '@/db/schema/credentials';

export class CredentialsService {
  /**
   * Get all credentials
   */
  static async getAllCredentials(): Promise<Credential[]> {
    try {
      return await db
        .select()
        .from(credentials)
        .orderBy(desc(credentials.createdAt));
    } catch (error) {
      console.error('Error fetching credentials:', error);
      throw new Error('Failed to fetch credentials');
    }
  }

  /**
   * Get credential by ID
   */
  static async getCredentialById(id: string): Promise<Credential | null> {
    try {
      const result = await db
        .select()
        .from(credentials)
        .where(eq(credentials.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching credential:', error);
      throw new Error('Failed to fetch credential');
    }
  }

  /**
   * Get credentials by type
   */
  static async getCredentialsByType(type: CredentialType): Promise<Credential[]> {
    try {
      return await db
        .select()
        .from(credentials)
        .where(eq(credentials.type, type))
        .orderBy(desc(credentials.createdAt));
    } catch (error) {
      console.error('Error fetching credentials by type:', error);
      throw new Error('Failed to fetch credentials by type');
    }
  }

  /**
   * Get credentials by provider
   */
  static async getCredentialsByProvider(provider: CredentialProvider): Promise<Credential[]> {
    try {
      return await db
        .select()
        .from(credentials)
        .where(eq(credentials.provider, provider))
        .orderBy(desc(credentials.createdAt));
    } catch (error) {
      console.error('Error fetching credentials by provider:', error);
      throw new Error('Failed to fetch credentials by provider');
    }
  }

  /**
   * Create credential
   */
  static async createCredential(data: NewCredential): Promise<Credential> {
    try {
      const validatedData = v.parse(insertCredentialSchema, data);

      const result = await db
        .insert(credentials)
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
      console.error('Error creating credential:', error);
      throw new Error('Failed to create credential');
    }
  }

  /**
   * Update credential
   */
  static async updateCredential(id: string, data: UpdateCredential): Promise<Credential> {
    try {
      const validatedData = v.parse(updateCredentialSchema, data);

      const result = await db
        .update(credentials)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(credentials.id, id))
        .returning();

      if (!result[0]) {
        throw new Error('Credential not found');
      }

      return result[0];
    } catch (error) {
      if (error instanceof v.ValiError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      console.error('Error updating credential:', error);
      throw new Error('Failed to update credential');
    }
  }

  /**
   * Delete credential
   */
  static async deleteCredential(id: string): Promise<Credential> {
    try {
      const result = await db
        .delete(credentials)
        .where(eq(credentials.id, id))
        .returning();

      if (!result[0]) {
        throw new Error('Credential not found');
      }

      return result[0];
    } catch (error) {
      console.error('Error deleting credential:', error);
      throw new Error('Failed to delete credential');
    }
  }

  /**
   * Get active credentials
   */
  static async getActiveCredentials(): Promise<Credential[]> {
    try {
      return await db
        .select()
        .from(credentials)
        .where(eq(credentials.isActive, true))
        .orderBy(desc(credentials.createdAt));
    } catch (error) {
      console.error('Error fetching active credentials:', error);
      throw new Error('Failed to fetch active credentials');
    }
  }

  /**
   * Get default credential for a type
   */
  static async getDefaultCredential(type: CredentialType): Promise<Credential | null> {
    try {
      const result = await db
        .select()
        .from(credentials)
        .where(and(
          eq(credentials.type, type),
          eq(credentials.isDefault, true)
        ))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching default credential:', error);
      throw new Error('Failed to fetch default credential');
    }
  }

  /**
   * Set credential as default for its type
   */
  static async setDefaultCredential(id: string): Promise<Credential> {
    try {
      // First, get the credential to know its type
      const credential = await CredentialsService.getCredentialById(id);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // Remove default flag from all credentials of the same type
      await db
        .update(credentials)
        .set({
          isDefault: false,
          updatedAt: new Date(),
        })
        .where(eq(credentials.type, credential.type));

      // Set this credential as default
      const result = await db
        .update(credentials)
        .set({
          isDefault: true,
          updatedAt: new Date(),
        })
        .where(eq(credentials.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error setting default credential:', error);
      throw new Error('Failed to set default credential');
    }
  }

  /**
   * Validate credential configuration
   */
  static async validateCredential(id: string): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const credential = await CredentialsService.getCredentialById(id);
      if (!credential) {
        return { valid: false, errors: ['Credential not found'] };
      }

      const errors: string[] = [];

      // Basic validation based on credential type
      switch (credential.type) {
        case 'oauth_google':
        case 'oauth_microsoft':
          if (!credential.clientId) errors.push('Client ID is required');
          if (!credential.clientSecret) errors.push('Client Secret is required');
          if (credential.type === 'oauth_microsoft' && !credential.tenantId) {
            errors.push('Tenant ID is required for Microsoft OAuth');
          }
          break;

        case 'smtp':
        case 'imap':
          if (!credential.endpoint) errors.push('Host/Endpoint is required');
          if (!credential.username) errors.push('Username is required');
          if (!credential.password) errors.push('Password is required');
          break;

        case 'api_key':
          if (!credential.apiKey) errors.push('API Key is required');
          break;

        case 'webhook':
          if (!credential.endpoint) errors.push('Webhook URL is required');
          break;

        case 'database':
          if (!credential.endpoint) errors.push('Database connection string is required');
          break;

        case 'storage':
          if (!credential.endpoint) errors.push('Storage endpoint is required');
          break;
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Error validating credential:', error);
      return {
        valid: false,
        errors: ['Validation failed due to internal error']
      };
    }
  }
}

// Export for convenience
export default CredentialsService;