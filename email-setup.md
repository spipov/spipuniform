You are a senior full-stack engineer.
Build a centralized Email Settings, Templates, and Logs system for a TanStack Start app using React 19, drizzle-orm, PostgreSQL, better-auth, TanStack Query, TanStack Form, valibot, and tailwindcss.

Core Features
1. Email Providers

Support sending emails via:

SMTP (generic)

Microsoft 365 (OAuth / SMTP)

Google Workspace (OAuth / SMTP)

Allow admin to configure provider settings in an Email Settings page.

Store settings encrypted in DB (provider, host, port, username, oauthTokens, etc.).

Provide test email button to confirm settings.

2. Templates

Email templates stored in DB with fields:

id

name (e.g., “User Invite”, “Verification”, “Approval”)

subjectTemplate (supports placeholders like {{appName}})

bodyTemplate (HTML/Markdown with placeholders)

updatedAt

Templates are editable in Admin Dashboard with live preview.

Support placeholders:

{{appName}}, {{supportEmail}}, {{year}}, {{userName}}, {{verifyLink}}, etc.

Use a small templating engine (e.g., mustache-like string replacement).

3. Email Log

Store logs in DB:

id

to

subject

status (“sent”, “failed”)

provider

errorMessage (if any)

createdAt

Admin UI: list of emails, filter by status/date, view details.

4. Branding Integration

Email system should pull branding variables from centralized config:

appName

appLogo

supportEmail

physicalAddress

socialLinks

Ensure these vars are auto-injected into templates.

Always include footer with:

© {{year}} {{appName}} · All rights reserved.

Tech Stack

TanStack Start (routing + loaders).

React 19.

drizzle-orm + PostgreSQL.

TanStack Query + TanStack Form for UI.

valibot for validation.

tailwindcss for styling.

Project Structure
/app
  /dashboard
    /admin
      email-settings.tsx   (SMTP/Provider config UI)
      email-templates.tsx  (CRUD + editor + preview)
      email-logs.tsx       (logs viewer)
/emails
  sendEmail.ts             (helper to send with correct provider + template)
  renderTemplate.ts        (template engine with placeholders)
/db
  schema.ts                (EmailSettings, EmailTemplates, EmailLogs tables)
/lib
  email-providers/
    smtp.ts
    microsoft.ts
    google.ts

Implementation Notes

Email Sending:

Use nodemailer or provider SDKs.

Wrap in sendEmail() function → logs success/failure in DB.

Pick provider based on saved settings.

Template Rendering:

renderTemplate(template, variables) replaces placeholders.

Support both subject + body.

Variables come from: branding + user-specific data.

UI:

Email Settings page → configure provider.

Templates page → CRUD + inline HTML/Markdown editor with preview.

Logs page → searchable + filterable list with resend option.

Validation:

Use valibot for all forms (settings + templates).

Security:

Encrypt stored credentials (SMTP passwords, OAuth tokens).

Deliverables

drizzle schema for EmailSettings, EmailTemplates, EmailLogs.

API routes for saving settings, CRUD templates, viewing logs.

UI pages for admin: settings, templates, logs.

sendEmail() + renderTemplate() helpers.

Example templates for: user invite, verification, approval, rejection, admin notifications.

🔥 Generate clean, modular, production-ready code with strong typing.