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

  static async approveUser(userId: string): Promise<boolean> {
    const rows = await db
      .update(user)
      .set({ banned: false, banReason: null, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning({ id: user.id, email: user.email, name: user.name });
    const u = rows[0];
    if (!u) return false;
    // Try using the configured Welcome template first
    try {
      const result = await EmailService.sendEmail({
        to: u.email,
        template: 'Welcome & Registration Email',
        subject: 'Welcome! Your account is approved',
        variables: { user_name: u.name },
      });
      if (result.success) return true;
      console.error('Approval email failed:', result.error || 'unknown error, trying fallback.');
    } catch (e) {
      console.error('Approval email exception (template path):', e);
    }

    // Fallback: simple branded HTML/text
    try {
      const branding = await BrandingService.getActiveBranding();
      const siteName = branding?.siteName || 'our site';
      const siteUrl = branding?.siteUrl || '';
      const supportEmail = branding?.supportEmail || '';
      const res2 = await EmailService.sendEmail({
        to: u.email,
        subject: 'Your account is approved',
        htmlContent: `<p>Hi ${u.name || ''},</p><p>Your account at ${siteName} has been approved. You can now sign in${siteUrl ? ` at <a href="${siteUrl}">${siteUrl}</a>` : ''}.</p>${supportEmail ? `<p>If you need help, contact ${supportEmail}.</p>` : ''}`,
        textContent: `Hi ${u.name || ''}, Your account at ${siteName} has been approved. You can now sign in${siteUrl ? ` at ${siteUrl}` : ''}.${supportEmail ? ` If you need help, contact ${supportEmail}.` : ''}`,
      });
      if (!res2.success) {
        console.error('Approval fallback email failed:', res2.error || 'unknown error');
      }
      return !!res2.success;
    } catch (e) {
      console.error('Approval fallback email exception:', e);
      return false;
    }
  }

  static async rejectUser(userId: string): Promise<boolean> {
    const rows = await db
      .update(user)
      .set({ banned: true, banReason: 'REJECTED', updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning({ id: user.id, email: user.email, name: user.name });
    const u = rows[0];
    if (!u) return false;
    try {
      const branding = await BrandingService.getActiveBranding();
      const result = await EmailService.sendEmail({
        to: u.email,
        template: 'Approval Rejected',
        subject: 'Your account application was not approved',
        variables: { user_name: u.name, support_email: branding?.supportEmail || 'support@example.com' },
      });
      if (!result.success) {
        console.error('Rejection email failed:', result.error || 'unknown error');
      }
      return !!result.success;
    } catch (e) {
      console.error('Rejection email exception:', e);
      return false;
    }
  }
}

