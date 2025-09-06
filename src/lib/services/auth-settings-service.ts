import { db } from '@/db';
import { authSettings, type AuthSettings, type NewAuthSettings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export class AuthSettingsService {
  static async get(): Promise<AuthSettings | null> {
    const rows = await db
      .select()
      .from(authSettings)
      .orderBy(desc(authSettings.createdAt))
      .limit(1);
    return rows[0] || null;
  }

  static async setRequireApproval(value: boolean): Promise<AuthSettings> {
    const current = await this.get();
    if (current) {
      const updated = await db
        .update(authSettings)
        .set({ requireAdminApproval: value, updatedAt: new Date() })
        .where(eq(authSettings.id, current.id))
        .returning();
      return updated[0];
    }
    const inserted = await db
      .insert(authSettings)
      .values({ requireAdminApproval: value })
      .returning();
    return inserted[0];
  }
}

