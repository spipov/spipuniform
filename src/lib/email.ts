// Email service placeholder
// This would typically integrate with services like Resend, SendGrid, or Nodemailer

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // TODO: Implement actual email sending logic
  console.log("Email would be sent:", {
    to: options.to,
    subject: options.subject,
    // Don't log the full content in production
  });

  // For development, we'll just log the email
  // In production, replace this with actual email service integration
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${process.env.BETTER_AUTH_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Verify your email address",
    html: `
      <h1>Verify your email address</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
    text: `Verify your email address by visiting: ${verificationUrl}`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${process.env.BETTER_AUTH_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: `
      <h1>Reset your password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
    `,
    text: `Reset your password by visiting: ${resetUrl}`,
  });
}
