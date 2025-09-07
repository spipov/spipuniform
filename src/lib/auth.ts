import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "@/db";
import { EmailService } from "@/lib/services/email/email-service";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // Prevent immediate session on sign-up; wait until email is verified
    autoSignIn: false,
    // Send password reset emails
    sendResetPassword: async ({ user, url, token }) => {
      try {
        // Ensure a proper absolute URL is sent
        let resetUrl = url;
        try {
          // Validate URL and ensure it exists
          const u = new URL(resetUrl);
          // nothing extra here, token is embedded in url
          resetUrl = u.toString();
        } catch {
          // Fallback to constructing with baseURL
          const baseUrl = (process.env.BETTER_AUTH_URL || '').replace(/\/$/, '');
          const sep = (url || '').includes('?') ? '&' : '?';
          resetUrl = `${(url && url.startsWith('http')) ? url : `${baseUrl}${url || ''}`}${sep}token=${encodeURIComponent(token)}`;
        }

        await EmailService.sendEmail({
          to: user.email,
          subject: 'Reset your password',
          htmlContent: `<p>Hi ${user.name || ''},</p><p>You requested to reset your password.</p><p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;border-radius:6px;text-decoration:none">Reset Password</a></p><p style="font-size:12px;color:#6b7280">If the button doesn't work, copy and paste this link: <a href="${resetUrl}">${resetUrl}</a></p>`,
          textContent: `Hi ${user.name || ''}, Reset your password: ${resetUrl}`,
        });
      } catch (e) {
        console.error('sendResetPassword failed:', e);
      }
    },
  },
  // Ensure verification emails are actually sent on sign-up
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      try {
        const baseUrl = (process.env.BETTER_AUTH_URL || '').replace(/\/$/, '');
        const desiredCallback = `${baseUrl}/auth/signin`;
        let verificationUrl = url || `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
        try {
          const u = new URL(verificationUrl);
          u.searchParams.set('callbackURL', desiredCallback);
          u.searchParams.set('callbackUrl', desiredCallback); // compatibility
          verificationUrl = u.toString();
        } catch {
          const sep = verificationUrl.includes('?') ? '&' : '?';
          verificationUrl = `${verificationUrl}${sep}callbackURL=${encodeURIComponent(desiredCallback)}`;
        }
        await EmailService.sendEmail({
          to: user.email,
          subject: 'Verify your email address',
          htmlContent: `<p>Hi ${user.name || ''},</p><p>Please verify your email to finish setting up your account.</p><p><a href="${verificationUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;border-radius:6px;text-decoration:none">Verify Email</a></p><p style="font-size:12px;color:#6b7280">If the button doesn't work, copy and paste this link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
          textContent: `Hi ${user.name || ''}, Please verify your email: ${verificationUrl}`,
        });
      } catch (e) {
        console.error('sendVerificationEmail failed:', e);
      }
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
});
