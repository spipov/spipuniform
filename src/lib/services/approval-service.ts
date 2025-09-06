import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/services/email/email-service';
import { BrandingService } from '@/lib/services/branding/branding-service';

export class ApprovalService {
  static async markPending(userId: string) {
    await db
      .update(user)
      .set({ banned: true, banReason: 'PENDING_APPROVAL', updatedAt: new Date() })
      .where(eq(user.id, userId));
  }

  static async approveUser(userId: string) {
    const rows = await db
      .update(user)
      .set({ banned: false, banReason: null, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning({ id: user.id, email: user.email, name: user.name });
    const u = rows[0];
    if (!u) return;
    try {
      await EmailService.sendEmail({
        to: u.email,
        template: 'Welcome & Registration Email',
        subject: 'Welcome! Your account is approved',
        variables: { user_name: u.name },
      });
    } catch {}
  }

  static async rejectUser(userId: string) {
    const rows = await db
      .update(user)
      .set({ banned: true, banReason: 'REJECTED', updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning({ id: user.id, email: user.email, name: user.name });
    const u = rows[0];
    if (!u) return;
    try {
      const branding = await BrandingService.getActiveBranding();
      await EmailService.sendEmail({
        to: u.email,
        template: 'Approval Rejected',
        subject: 'Your account application was not approved',
        variables: { user_name: u.name, support_email: branding?.supportEmail || 'support@example.com' },
      });
    } catch {}
  }
}

