You are a senior full-stack engineer.
Build a Branding Settings system for a TanStack Start app with React 19, drizzle-orm, PostgreSQL, TanStack Query, TanStack Form, valibot, and tailwindcss.

Core Features
1. Branding Settings

Admin can configure branding fields in a Branding Settings page:

appName (string)

supportEmail (string)

logoType (enum: "nameOnly" | "logoOnly" | "logoAndName")

logoFile (image upload, stored as URL)

faviconFile (image upload, stored as URL)

typography (font family + base font size)

themeColors (primary, secondary, tertiary — Tailwind color tokens)

2. UI Integration

Dashboard top-left branding should update based on logoType:

"nameOnly" → show app name

"logoOnly" → show logo only

"logoAndName" → show logo + app name side-by-side

Frontend + Email templates should pull branding automatically from DB.

Tailwind theme should adapt dynamically to configured colors (e.g., primary, secondary, tertiary).

3. Persistence

Store branding settings in a dedicated DB table.

Ensure only one record exists (singleton).

Provide CRUD API to update + fetch branding config.

4. Defaults

Seed default branding values:

appName = "MyApp"

supportEmail = "support@myapp.com"

themeColors = { primary: "blue", secondary: "gray", tertiary: "white" }

typography = { font: "Inter", size: "16px" }

Tech Stack

TanStack Start (routing + loaders).

React 19.

drizzle-orm + PostgreSQL.

TanStack Query + TanStack Form for data + forms.

valibot for validation.

tailwindcss for styling (colors + typography).

Project Structure
/app
  /dashboard
    /admin
      branding.tsx       (Branding Settings UI)
/components
  BrandingPreview.tsx    (live preview of logo/name/colors)
  ColorPicker.tsx
  FileUpload.tsx
/db
  schema.ts              (branding table)
/lib
  branding.ts            (helper to fetch/apply branding globally)
  tailwind-config.ts     (extend Tailwind with dynamic branding colors)
/server
  /routes
    branding.ts          (API routes for branding CRUD)

Implementation Notes

DB Schema:

branding: {
  id: string (uuid, pk)
  appName: string
  supportEmail: string
  logoType: "nameOnly" | "logoOnly" | "logoAndName"
  logoFile: string (url)
  faviconFile: string (url)
  typography: json { font: string, size: string }
  themeColors: json { primary: string, secondary: string, tertiary: string }
  updatedAt: timestamp
}


Theme Application:

Extend Tailwind config dynamically with branding colors.

Apply typography + font size via CSS variables.

UI:

Form with live preview (logo, name, colors, typography).

Use ColorPicker + FileUpload components.

Validation with valibot (ensure valid email, hex colors, font size).

Frontend:

Use a useBranding() hook that fetches branding from DB.

Make branding available globally via context/provider.

Deliverables

drizzle schema + migration for branding table.

API routes for get/update branding.

Admin UI form + preview.

Tailwind integration for dynamic theme.

Branding provider hook for global access.

🔥 Generate clean, modular, production-ready code with strong typing.