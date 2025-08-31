You are a senior full-stack engineer.
Build a user registration and creation flow for a TanStack Start app with React 19, better-auth, drizzle-orm, PostgreSQL, TanStack Query, TanStack Form, valibot, and tailwindcss.

Flow Requirements
1. Admin-Created Users

Admin can create a new user in the Admin Dashboard.

When an admin creates a user:

A user record is inserted in DB with status = "pending_verification".

User receives an email with a verification link (via better-auth’s built-in email flow, or custom token if needed).

When user clicks link → they are directed to a Set Password page.

After setting password, the account is marked verified + active, and user can sign in.

2. User Self-Registration

A visitor can sign up through /auth/register.

Flow:

User record is created with status = "awaiting_admin_approval".

User receives email verification link (to confirm their email).

Once verified, the user is visible in Admin Dashboard with a “Pending Approval” badge/bubble.

Admin receives an email notification about the pending user.

Admin can approve/reject from dashboard:

Approve: user receives email “Your account is active, you can sign in”.

Reject: user receives email “Your account was rejected”.

3. Statuses

Users table includes a status column:

"pending_verification" (admin-created but not verified by user)

"awaiting_admin_approval" (self-register, needs admin approval)

"active" (verified + approved)

"rejected" (application denied)

4. Email Handling

Use better-auth’s built-in email system for magic links / verification tokens.

Provide customizable email templates for:

Admin-created user invitation.

Self-registration email verification.

Admin notification of pending user.

User activated.

User rejected.

Tech Stack

TanStack Start (routing + loaders).

React 19.

better-auth for authentication, sessions, and email links.

drizzle-orm + PostgreSQL for schema + migrations.

TanStack Query + TanStack Form for frontend interactions.

valibot for validation.

tailwindcss for UI.

Database Schema (drizzle)

Extend the existing users table:

users: {
  id: string (uuid, pk)
  name: string
  email: string (unique)
  password: string (nullable until set)
  roleId: string (fk → roles.id)
  color: string
  status: "pending_verification" | "awaiting_admin_approval" | "active" | "rejected"
  createdAt: timestamp
}

Project Structure
/app
  /auth
    login.tsx
    register.tsx
    verify.tsx       (handles email verification + set password)
  /dashboard
    /admin
      users.tsx       (CRUD + approve/reject pending users)
/components
  UserFormDialog.tsx
  VerificationBadge.tsx
/emails
  invite-user.ts
  verify-user.ts
  user-approved.ts
  user-rejected.ts
  notify-admin.ts
/server
  /routes
    users.ts         (CRUD API for users)
/lib
  auth.ts            (better-auth config)
  mailer.ts          (helper to send templated emails)

Implementation Notes

Admin-created users:

Generate a verification token using better-auth.

Email includes link → /auth/verify?token=....

On verification page, prompt to set password (validated with valibot).

Mark status = "active".

Self-registration:

On sign-up, status = "awaiting_admin_approval".

After email verification, mark "email_verified" but keep status as "awaiting_admin_approval".

Admin must manually approve → then mark "active".

Emails should be modular (stored in /emails folder).

Middleware should block non-"active" users from signing in.

Deliverables

drizzle schema + migration for status column.

better-auth integration with custom flows (admin-created invite + user self-registration).

API routes for admin approve/reject.

React pages: register, verify, set password, admin user management.

Email templates.

Tailwind UI components for dialogs + badges.

🔥 Generate code in a clean, modular, production-ready style with strong typing.