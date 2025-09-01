# Issues and Reset Plan

## Current Issues Encountered

### 1. Database Schema Mismatch

**Problem**: Critical mismatch between Drizzle ORM schema definitions and actual database table structure.

**Details**:
- Drizzle schema in `src/db/schema/branding.ts` defines camelCase field names (e.g., `siteName`, `logoType`)
- Database table has snake_case column names (e.g., `site_name`, `logo_type`)
- PostgreSQL error: `column "site_name" does not exist` with hint suggesting `siteName` was intended
- This creates a circular reference problem where neither naming convention works

**Root Cause**: Multiple migrations and schema changes created inconsistent state between ORM and database

### 2. Multiple Conflicting Branding Tables

**Problem**: Database contains multiple branding-related tables causing confusion.

**Tables Found**:
- `branding` (our target table with snake_case columns)
- `app_branding` (different structure entirely)
- `app_branding_global_variables`
- `app_branding_social_links`

**Impact**: Unclear which table the application should use, potential data conflicts

### 3. Drizzle Introspection Mismatch

**Problem**: `pnpm drizzle-kit introspect` generates schema that doesn't match our intended structure.

**Details**:
- Introspected schema shows different column structure than our manual schema
- Generated schema has `siteName`, `supportEmail`, `logo`, `colors`, `typography`, `layout` fields
- Our intended schema has more granular fields like `logoType`, `logoUrl`, `primaryColor`, etc.

### 4. Migration History Corruption

**Problem**: Multiple migration attempts created inconsistent database state.

**Migration Files**:
- `002_create_branding_table.sql` - Initial branding table
- `003_fix_branding_schema.sql` - Attempted fix
- `004_fix_branding_column_names.sql` - Snake case conversion

**Result**: Database schema doesn't match any single migration file

### 5. File Manager System Integration Issues

**Problem**: File manager system was implemented but may have similar schema issues.

**Potential Issues**:
- Similar ORM/database mismatch
- Integration with branding system for file uploads
- Storage configuration conflicts

## Current Database State

### Branding Table Structure (Actual)
```sql
COLUMNS:
- id (uuid)
- site_name (varchar)
- support_email (varchar)
- logo_type (varchar)
- logo_url (text)
- favicon_url (text)
- primary_color (varchar)
- secondary_color (varchar)
- accent_color (varchar)
- background_color (varchar)
- text_color (varchar)
- typography (json)
- border_radius (varchar)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Expected Drizzle Schema
```typescript
// What we want in src/db/schema/branding.ts
export const branding = pgTable("branding", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteName: varchar("site_name", { length: 255 }).notNull().default("MyApp"),
  supportEmail: varchar("support_email", { length: 255 }).notNull().default("support@myapp.com"),
  // ... etc with proper column mapping
});
```

## Reset Plan

### Phase 1: Git Reset and Clean State

1. **Check Current Git Status**
   ```bash
   git status
   git log --oneline -10  # Review recent commits
   ```

2. **Identify Last Working Commit**
   Look for commit before branding/file-manager implementation:
   ```bash
   git log --oneline --grep="branding" --grep="file-manager" --grep="file manager" --invert-grep
   ```

3. **Backup Current Work (Optional)**
   ```bash
   git stash push -m "backup-before-reset-$(date +%Y%m%d-%H%M%S)"
   git branch backup-branding-work-$(date +%Y%m%d-%H%M%S)
   ```

4. **Reset to Last Working Commit**
   ```bash
   git reset --hard <commit-hash>  # Use hash from step 2
   ```

5. **Clean Working Directory**
   ```bash
   git clean -fd  # Remove untracked files
   git status     # Verify clean state
   ```

### Phase 2: Database Reset

1. **Stop Development Server**
   ```bash
   # Kill any running pnpm dev processes
   pkill -f "pnpm dev" || true
   ```

2. **Backup Current Database (Optional)**
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

3. **Drop Current Database**
   ```bash
   # Extract database name from DATABASE_URL
   DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///g' | sed 's/?.*//g')
   echo "Dropping database: $DB_NAME"
   
   # Connect to postgres database to drop target database
   psql "postgresql://naazim:password@localhost:5432/postgres" -c "DROP DATABASE IF EXISTS $DB_NAME;"
   ```

4. **Recreate Database**
   ```bash
   psql "postgresql://naazim:password@localhost:5432/postgres" -c "CREATE DATABASE $DB_NAME;"
   echo "Database $DB_NAME recreated successfully"
   ```

5. **Verify Database Connection**
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

6. **Run Base Migrations Only**
   ```bash
   # Ensure we're in project root
   cd /Users/naazim/Downloads/Spipdesigns/Websites/Apps/WebApps/spipboiler
   
   # Run essential migrations in order
   echo "Running base migrations..."
   psql $DATABASE_URL -f migrations/000_better_auth_schema.sql
   psql $DATABASE_URL -f migrations/001_create_roles_table.sql
   
   # Verify tables were created
   psql $DATABASE_URL -c "\dt"
   ```

7. **Verify Base System Works**
   ```bash
   pnpm install  # Ensure dependencies are installed
   pnpm dev      # Start server to test base functionality
   ```

### Phase 3: Proper Implementation Plan

#### 3.1 Branding System (Clean Implementation)

**Step 1: Design Schema First**

1. **Create Drizzle Schema with Explicit Column Mapping**
   
   File: `src/db/schema/branding.ts`
   ```typescript
   import { pgTable, uuid, varchar, text, boolean, timestamp, json, index } from "drizzle-orm/pg-core";
   
   export const branding = pgTable(
     "branding",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       
       // Site Information (snake_case in DB, camelCase in TS)
       siteName: varchar("site_name", { length: 255 }).notNull().default("MyApp"),
       supportEmail: varchar("support_email", { length: 255 }).notNull().default("support@myapp.com"),
       
       // Logo Configuration
       logoType: varchar("logo_type", { length: 50 }).notNull().default("text"), // 'text', 'image', 'svg'
       logoUrl: text("logo_url"),
       logoText: varchar("logo_text", { length: 100 }),
       faviconUrl: text("favicon_url"),
       
       // Color Scheme
       primaryColor: varchar("primary_color", { length: 7 }).notNull().default("#3b82f6"),
       secondaryColor: varchar("secondary_color", { length: 7 }).notNull().default("#64748b"),
       accentColor: varchar("accent_color", { length: 7 }).notNull().default("#f59e0b"),
       backgroundColor: varchar("background_color", { length: 7 }).notNull().default("#ffffff"),
       textColor: varchar("text_color", { length: 7 }).notNull().default("#1f2937"),
       
       // Typography
       typography: json("typography").$type<{
         primaryFont: string;
         secondaryFont: string;
         headingWeight: number;
         bodyWeight: number;
         fontSize: {
           xs: string;
           sm: string;
           base: string;
           lg: string;
           xl: string;
           "2xl": string;
           "3xl": string;
         };
       }>().default({
         primaryFont: "Inter",
         secondaryFont: "Inter",
         headingWeight: 600,
         bodyWeight: 400,
         fontSize: {
           xs: "0.75rem",
           sm: "0.875rem",
           base: "1rem",
           lg: "1.125rem",
           xl: "1.25rem",
           "2xl": "1.5rem",
           "3xl": "1.875rem"
         }
       }),
       
       // Layout & Styling
       borderRadius: varchar("border_radius", { length: 20 }).notNull().default("0.5rem"),
       
       // Status
       isActive: boolean("is_active").notNull().default(true),
       
       // Timestamps
       createdAt: timestamp("created_at").notNull().defaultNow(),
       updatedAt: timestamp("updated_at").notNull().defaultNow(),
     },
     (table) => ({
       activeIdx: index("branding_active_idx").on(table.isActive),
     })
   );
   
   export type Branding = typeof branding.$inferSelect;
   export type NewBranding = typeof branding.$inferInsert;
   ```

2. **Update Main Schema Export**
   
   File: `src/db/schema/index.ts`
   ```typescript
   export * from "./auth";
   export * from "./users";
   export * from "./roles";
   export * from "./branding";
   ```

**Step 2: Create Migration**

1. **Single Clean Migration File**
   
   File: `migrations/002_create_branding_system.sql`
   ```sql
   -- Create branding table with proper constraints
   CREATE TABLE IF NOT EXISTS "branding" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     
     -- Site Information
     "site_name" varchar(255) NOT NULL DEFAULT 'MyApp',
     "support_email" varchar(255) NOT NULL DEFAULT 'support@myapp.com',
     
     -- Logo Configuration
     "logo_type" varchar(50) NOT NULL DEFAULT 'text' CHECK (logo_type IN ('text', 'image', 'svg')),
     "logo_url" text,
     "logo_text" varchar(100),
     "favicon_url" text,
     
     -- Color Scheme (hex colors)
     "primary_color" varchar(7) NOT NULL DEFAULT '#3b82f6' CHECK (primary_color ~ '^#[0-9a-fA-F]{6}$'),
     "secondary_color" varchar(7) NOT NULL DEFAULT '#64748b' CHECK (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
     "accent_color" varchar(7) NOT NULL DEFAULT '#f59e0b' CHECK (accent_color ~ '^#[0-9a-fA-F]{6}$'),
     "background_color" varchar(7) NOT NULL DEFAULT '#ffffff' CHECK (background_color ~ '^#[0-9a-fA-F]{6}$'),
     "text_color" varchar(7) NOT NULL DEFAULT '#1f2937' CHECK (text_color ~ '^#[0-9a-fA-F]{6}$'),
     
     -- Typography (JSON)
     "typography" jsonb NOT NULL DEFAULT '{
       "primaryFont": "Inter",
       "secondaryFont": "Inter",
       "headingWeight": 600,
       "bodyWeight": 400,
       "fontSize": {
         "xs": "0.75rem",
         "sm": "0.875rem",
         "base": "1rem",
         "lg": "1.125rem",
         "xl": "1.25rem",
         "2xl": "1.5rem",
         "3xl": "1.875rem"
       }
     }'::jsonb,
     
     -- Layout & Styling
     "border_radius" varchar(20) NOT NULL DEFAULT '0.5rem',
     
     -- Status
     "is_active" boolean NOT NULL DEFAULT true,
     
     -- Timestamps
     "created_at" timestamp with time zone NOT NULL DEFAULT now(),
     "updated_at" timestamp with time zone NOT NULL DEFAULT now()
   );
   
   -- Create indexes
   CREATE INDEX IF NOT EXISTS "branding_active_idx" ON "branding" ("is_active");
   
   -- Create trigger for updated_at
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = now();
     RETURN NEW;
   END;
   $$ language 'plpgsql';
   
   CREATE TRIGGER update_branding_updated_at
     BEFORE UPDATE ON "branding"
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
   
   -- Insert default branding configuration
   INSERT INTO "branding" (
     "site_name",
     "support_email",
     "logo_type",
     "logo_text",
     "is_active"
   ) VALUES (
     'SpipBoiler',
     'support@spipboiler.com',
     'text',
     'SpipBoiler',
     true
   ) ON CONFLICT DO NOTHING;
   
   -- Ensure only one active branding configuration
   CREATE OR REPLACE FUNCTION ensure_single_active_branding()
   RETURNS TRIGGER AS $$
   BEGIN
     IF NEW.is_active = true THEN
       UPDATE "branding" SET "is_active" = false WHERE "id" != NEW.id;
     END IF;
     RETURN NEW;
   END;
   $$ language 'plpgsql';
   
   CREATE TRIGGER ensure_single_active_branding_trigger
     AFTER INSERT OR UPDATE ON "branding"
     FOR EACH ROW
     WHEN (NEW.is_active = true)
     EXECUTE FUNCTION ensure_single_active_branding();
   ```

2. **Test Migration**
   ```bash
   # Test migration on fresh database
   psql $DATABASE_URL -f migrations/002_create_branding_system.sql
   
   # Verify table structure
   psql $DATABASE_URL -c "\d branding"
   
   # Verify default data
   psql $DATABASE_URL -c "SELECT * FROM branding;"
   ```

**Step 3: API Implementation**

1. **Branding Service Layer**
   
   File: `src/lib/services/branding.ts`
   ```typescript
   import { db } from "@/db";
   import { branding, type Branding, type NewBranding } from "@/db/schema";
   import { eq, and } from "drizzle-orm";
   
   export class BrandingService {
     static async getActiveBranding(): Promise<Branding | null> {
       const result = await db
         .select()
         .from(branding)
         .where(eq(branding.isActive, true))
         .limit(1);
       
       return result[0] || null;
     }
   
     static async updateBranding(
       id: string,
       updates: Partial<NewBranding>
     ): Promise<Branding> {
       const result = await db
         .update(branding)
         .set({
           ...updates,
           updatedAt: new Date(),
         })
         .where(eq(branding.id, id))
         .returning();
   
       if (!result[0]) {
         throw new Error("Branding configuration not found");
       }
   
       return result[0];
     }
   
     static async createBranding(data: NewBranding): Promise<Branding> {
       const result = await db
         .insert(branding)
         .values(data)
         .returning();
   
       return result[0];
     }
   
     static async getAllBranding(): Promise<Branding[]> {
       return await db.select().from(branding);
     }
   }
   ```

2. **GET Branding API**
   
   File: `src/routes/api.branding.ts`
   ```typescript
   import { createAPIFileRoute } from "@tanstack/start/api";
   import { BrandingService } from "@/lib/services/branding";
   import { json } from "@tanstack/start";
   
   export const Route = createAPIFileRoute("/api/branding")(
     {
       GET: async ({ request }) => {
         try {
           const branding = await BrandingService.getActiveBranding();
           
           if (!branding) {
             return json(
               { error: "No active branding configuration found" },
               { status: 404 }
             );
           }
   
           return json({ branding });
         } catch (error) {
           console.error("Error fetching branding:", error);
           return json(
             { error: "Failed to fetch branding configuration" },
             { status: 500 }
           );
         }
       },
   
       PUT: async ({ request }) => {
         try {
           // TODO: Add authentication check for admin role
           
           const body = await request.json();
           const currentBranding = await BrandingService.getActiveBranding();
           
           if (!currentBranding) {
             return json(
               { error: "No active branding configuration found" },
               { status: 404 }
             );
           }
   
           const updatedBranding = await BrandingService.updateBranding(
             currentBranding.id,
             body
           );
   
           return json({ branding: updatedBranding });
         } catch (error) {
           console.error("Error updating branding:", error);
           return json(
             { error: "Failed to update branding configuration" },
             { status: 500 }
           );
         }
       },
     }
   );
   ```

3. **File Upload API for Branding**
   
   File: `src/routes/api.branding.upload.ts`
   ```typescript
   import { createAPIFileRoute } from "@tanstack/start/api";
   import { json } from "@tanstack/start";
   import { writeFile, mkdir } from "fs/promises";
   import { join } from "path";
   import { BrandingService } from "@/lib/services/branding";
   
   const UPLOAD_DIR = join(process.cwd(), "uploads", "branding");
   const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
   const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
   
   export const Route = createAPIFileRoute("/api/branding/upload")({
     POST: async ({ request }) => {
       try {
         // TODO: Add authentication check for admin role
         
         const formData = await request.formData();
         const file = formData.get("file") as File;
         const type = formData.get("type") as string; // 'logo' or 'favicon'
         
         if (!file) {
           return json({ error: "No file provided" }, { status: 400 });
         }
         
         if (!ALLOWED_TYPES.includes(file.type)) {
           return json(
             { error: "Invalid file type. Allowed: JPEG, PNG, SVG, WebP" },
             { status: 400 }
           );
         }
         
         if (file.size > MAX_FILE_SIZE) {
           return json(
             { error: "File too large. Maximum size: 5MB" },
             { status: 400 }
           );
         }
         
         // Ensure upload directory exists
         await mkdir(UPLOAD_DIR, { recursive: true });
         
         // Generate unique filename
         const timestamp = Date.now();
         const extension = file.name.split(".").pop();
         const filename = `${type}-${timestamp}.${extension}`;
         const filepath = join(UPLOAD_DIR, filename);
         
         // Save file
         const buffer = Buffer.from(await file.arrayBuffer());
         await writeFile(filepath, buffer);
         
         // Generate URL
         const fileUrl = `/uploads/branding/${filename}`;
         
         // Update branding configuration
         const currentBranding = await BrandingService.getActiveBranding();
         if (currentBranding) {
           const updateData = type === "logo" 
             ? { logoUrl: fileUrl, logoType: "image" as const }
             : { faviconUrl: fileUrl };
             
           await BrandingService.updateBranding(currentBranding.id, updateData);
         }
         
         return json({ 
           success: true, 
           url: fileUrl,
           filename 
         });
       } catch (error) {
         console.error("Error uploading file:", error);
         return json(
           { error: "Failed to upload file" },
           { status: 500 }
         );
       }
     },
   });
   ```

**Step 4: Frontend Integration**

1. **Branding Context Provider**
   
   File: `src/contexts/branding-context.tsx`
   ```typescript
   import React, { createContext, useContext, useEffect, useState } from "react";
   import type { Branding } from "@/db/schema";
   
   interface BrandingContextType {
     branding: Branding | null;
     loading: boolean;
     error: string | null;
     updateBranding: (updates: Partial<Branding>) => Promise<void>;
     refreshBranding: () => Promise<void>;
   }
   
   const BrandingContext = createContext<BrandingContextType | undefined>(undefined);
   
   export function BrandingProvider({ children }: { children: React.ReactNode }) {
     const [branding, setBranding] = useState<Branding | null>(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
   
     const fetchBranding = async () => {
       try {
         setLoading(true);
         setError(null);
         
         const response = await fetch("/api/branding");
         if (!response.ok) {
           throw new Error("Failed to fetch branding");
         }
         
         const data = await response.json();
         setBranding(data.branding);
       } catch (err) {
         setError(err instanceof Error ? err.message : "Unknown error");
       } finally {
         setLoading(false);
       }
     };
   
     const updateBranding = async (updates: Partial<Branding>) => {
       try {
         const response = await fetch("/api/branding", {
           method: "PUT",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify(updates),
         });
         
         if (!response.ok) {
           throw new Error("Failed to update branding");
         }
         
         const data = await response.json();
         setBranding(data.branding);
       } catch (err) {
         throw err;
       }
     };
   
     useEffect(() => {
       fetchBranding();
     }, []);
   
     return (
       <BrandingContext.Provider
         value={{
           branding,
           loading,
           error,
           updateBranding,
           refreshBranding: fetchBranding,
         }}
       >
         {children}
       </BrandingContext.Provider>
     );
   }
   
   export function useBranding() {
     const context = useContext(BrandingContext);
     if (context === undefined) {
       throw new Error("useBranding must be used within a BrandingProvider");
     }
     return context;
   }
   ```

#### 3.2 File Manager System (Clean Implementation)

**Step 1: Core File Storage Schema**

1. **File Storage Schema**
   
   File: `src/db/schema/files.ts`
   ```typescript
   import { pgTable, uuid, varchar, text, integer, boolean, timestamp, json, index } from "drizzle-orm/pg-core";
   
   export const files = pgTable(
     "files",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       
       // File Information
       originalName: varchar("original_name", { length: 255 }).notNull(),
       filename: varchar("filename", { length: 255 }).notNull().unique(),
       mimeType: varchar("mime_type", { length: 100 }).notNull(),
       size: integer("size").notNull(), // in bytes
       
       // Storage Information
       storageProvider: varchar("storage_provider", { length: 50 }).notNull().default("local"),
       storagePath: text("storage_path").notNull(),
       publicUrl: text("public_url"),
       
       // File Metadata
       metadata: json("metadata").$type<{
         width?: number;
         height?: number;
         duration?: number;
         alt?: string;
         description?: string;
         tags?: string[];
       }>(),
       
       // Access Control
       isPublic: boolean("is_public").notNull().default(false),
       uploadedBy: uuid("uploaded_by").references(() => users.id),
       
       // Organization
       category: varchar("category", { length: 50 }).default("general"), // 'branding', 'avatar', 'document', etc.
       
       // Status
       isActive: boolean("is_active").notNull().default(true),
       
       // Timestamps
       createdAt: timestamp("created_at").notNull().defaultNow(),
       updatedAt: timestamp("updated_at").notNull().defaultNow(),
     },
     (table) => ({
       filenameIdx: index("files_filename_idx").on(table.filename),
       categoryIdx: index("files_category_idx").on(table.category),
       uploadedByIdx: index("files_uploaded_by_idx").on(table.uploadedBy),
       publicIdx: index("files_public_idx").on(table.isPublic),
     })
   );
   
   export type File = typeof files.$inferSelect;
   export type NewFile = typeof files.$inferInsert;
   ```

2. **File Storage Migration**
   
   File: `migrations/003_create_file_system.sql`
   ```sql
   -- Create files table
   CREATE TABLE IF NOT EXISTS "files" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     
     -- File Information
     "original_name" varchar(255) NOT NULL,
     "filename" varchar(255) NOT NULL UNIQUE,
     "mime_type" varchar(100) NOT NULL,
     "size" integer NOT NULL CHECK (size >= 0),
     
     -- Storage Information
     "storage_provider" varchar(50) NOT NULL DEFAULT 'local',
     "storage_path" text NOT NULL,
     "public_url" text,
     
     -- File Metadata
     "metadata" jsonb DEFAULT '{}'::jsonb,
     
     -- Access Control
     "is_public" boolean NOT NULL DEFAULT false,
     "uploaded_by" uuid REFERENCES "user"("id") ON DELETE SET NULL,
     
     -- Organization
     "category" varchar(50) DEFAULT 'general',
     
     -- Status
     "is_active" boolean NOT NULL DEFAULT true,
     
     -- Timestamps
     "created_at" timestamp with time zone NOT NULL DEFAULT now(),
     "updated_at" timestamp with time zone NOT NULL DEFAULT now()
   );
   
   -- Create indexes
   CREATE INDEX IF NOT EXISTS "files_filename_idx" ON "files" ("filename");
   CREATE INDEX IF NOT EXISTS "files_category_idx" ON "files" ("category");
   CREATE INDEX IF NOT EXISTS "files_uploaded_by_idx" ON "files" ("uploaded_by");
   CREATE INDEX IF NOT EXISTS "files_public_idx" ON "files" ("is_public");
   
   -- Create trigger for updated_at
   CREATE TRIGGER update_files_updated_at
     BEFORE UPDATE ON "files"
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at_column();
   
   -- Create storage settings table
   CREATE TABLE IF NOT EXISTS "storage_settings" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     "provider" varchar(50) NOT NULL DEFAULT 'local',
     "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
     "is_active" boolean NOT NULL DEFAULT true,
     "created_at" timestamp with time zone NOT NULL DEFAULT now(),
     "updated_at" timestamp with time zone NOT NULL DEFAULT now()
   );
   
   -- Insert default local storage configuration
   INSERT INTO "storage_settings" ("provider", "config", "is_active") VALUES (
     'local',
     '{
       "uploadPath": "uploads",
       "maxFileSize": 10485760,
       "allowedTypes": ["image/jpeg", "image/png", "image/svg+xml", "image/webp", "application/pdf"]
     }'::jsonb,
     true
   ) ON CONFLICT DO NOTHING;
   ```

**Step 2: File Service Implementation**

1. **File Storage Service**
   
   File: `src/lib/services/file-storage.ts`
   ```typescript
   import { writeFile, mkdir, unlink, stat } from "fs/promises";
   import { join, extname } from "path";
   import { db } from "@/db";
   import { files, type File, type NewFile } from "@/db/schema";
   import { eq } from "drizzle-orm";
   
   export interface UploadOptions {
     category?: string;
     isPublic?: boolean;
     metadata?: Record<string, any>;
     uploadedBy?: string;
   }
   
   export class FileStorageService {
     private static UPLOAD_BASE_DIR = join(process.cwd(), "uploads");
     private static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
     private static ALLOWED_TYPES = [
       "image/jpeg",
       "image/png", 
       "image/svg+xml",
       "image/webp",
       "application/pdf",
       "text/plain",
     ];
   
     static async uploadFile(
       file: File,
       options: UploadOptions = {}
     ): Promise<File> {
       // Validate file
       if (file.size > this.MAX_FILE_SIZE) {
         throw new Error(`File too large. Maximum size: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
       }
   
       if (!this.ALLOWED_TYPES.includes(file.type)) {
         throw new Error(`Invalid file type: ${file.type}`);
       }
   
       // Generate unique filename
       const timestamp = Date.now();
       const randomSuffix = Math.random().toString(36).substring(2, 8);
       const extension = extname(file.name);
       const filename = `${timestamp}-${randomSuffix}${extension}`;
   
       // Determine storage path
       const category = options.category || "general";
       const categoryDir = join(this.UPLOAD_BASE_DIR, category);
       const filepath = join(categoryDir, filename);
   
       // Ensure directory exists
       await mkdir(categoryDir, { recursive: true });
   
       // Save file
       const buffer = Buffer.from(await file.arrayBuffer());
       await writeFile(filepath, buffer);
   
       // Generate public URL
       const publicUrl = `/uploads/${category}/${filename}`;
   
       // Save to database
       const fileRecord: NewFile = {
         originalName: file.name,
         filename,
         mimeType: file.type,
         size: file.size,
         storageProvider: "local",
         storagePath: filepath,
         publicUrl,
         metadata: options.metadata || {},
         isPublic: options.isPublic ?? false,
         uploadedBy: options.uploadedBy,
         category,
       };
   
       const result = await db.insert(files).values(fileRecord).returning();
       return result[0];
     }
   
     static async getFile(id: string): Promise<File | null> {
       const result = await db
         .select()
         .from(files)
         .where(eq(files.id, id))
         .limit(1);
   
       return result[0] || null;
     }
   
     static async deleteFile(id: string): Promise<boolean> {
       const file = await this.getFile(id);
       if (!file) return false;
   
       try {
         // Delete physical file
         await unlink(file.storagePath);
       } catch (error) {
         console.warn(`Failed to delete physical file: ${file.storagePath}`, error);
       }
   
       // Delete from database
       await db.delete(files).where(eq(files.id, id));
       return true;
     }
   
     static async getFilesByCategory(category: string): Promise<File[]> {
       return await db
         .select()
         .from(files)
         .where(eq(files.category, category));
     }
   }
   ```

**Step 3: Integration Points**

1. **File Upload API**
   
   File: `src/routes/api.files.upload.ts`
   ```typescript
   import { createAPIFileRoute } from "@tanstack/start/api";
   import { json } from "@tanstack/start";
   import { FileStorageService } from "@/lib/services/file-storage";
   
   export const Route = createAPIFileRoute("/api/files/upload")({
     POST: async ({ request }) => {
       try {
         // TODO: Add authentication check
         
         const formData = await request.formData();
         const file = formData.get("file") as File;
         const category = formData.get("category") as string;
         const isPublic = formData.get("isPublic") === "true";
         
         if (!file) {
           return json({ error: "No file provided" }, { status: 400 });
         }
         
         const uploadedFile = await FileStorageService.uploadFile(file, {
           category,
           isPublic,
           // uploadedBy: user.id, // TODO: Get from auth
         });
         
         return json({ 
           success: true, 
           file: uploadedFile 
         });
       } catch (error) {
         console.error("Error uploading file:", error);
         return json(
           { error: error instanceof Error ? error.message : "Failed to upload file" },
           { status: 500 }
         );
       }
     },
   });
   ```

## Key Lessons Learned

1. **Schema First**: Always design and test database schema before ORM implementation
2. **Single Migration**: Avoid multiple "fix" migrations, create clean single migration
3. **Column Mapping**: Be explicit about database column names vs TypeScript field names
4. **Test Migrations**: Test all migrations on fresh database before applying to development
5. **Incremental Development**: Implement core functionality first, add features incrementally

## Comprehensive Testing & Validation

### Phase 4: Testing Procedures

#### 4.1 Database Schema Validation

1. **Verify Schema Consistency**
   ```bash
   # Test Drizzle schema generation
   pnpm drizzle-kit generate:pg
   
   # Compare generated SQL with our migration
   diff migrations/002_create_branding_system.sql drizzle/0002_*.sql
   
   # Introspect database and compare with schema
   pnpm drizzle-kit introspect:pg
   diff src/db/schema/branding.ts drizzle/schema.ts
   ```

2. **Test Column Mapping**
   ```bash
   # Test that Drizzle can query the database successfully
   psql $DATABASE_URL -c "SELECT 
     site_name as \"siteName\",
     support_email as \"supportEmail\",
     logo_type as \"logoType\"
   FROM branding LIMIT 1;"
   ```

3. **Validate Constraints**
   ```bash
   # Test color validation
   psql $DATABASE_URL -c "INSERT INTO branding (site_name, primary_color) VALUES ('test', 'invalid-color');" || echo "Constraint working"
   
   # Test logo_type constraint
   psql $DATABASE_URL -c "INSERT INTO branding (site_name, logo_type) VALUES ('test', 'invalid-type');" || echo "Constraint working"
   ```

#### 4.2 API Testing

1. **Branding API Tests**
   ```bash
   # Start server
   pnpm dev &
   SERVER_PID=$!
   sleep 5  # Wait for server to start
   
   # Test GET branding
   curl -s http://localhost:3100/api/branding | jq .
   
   # Test PUT branding
   curl -s -X PUT http://localhost:3100/api/branding \
     -H "Content-Type: application/json" \
     -d '{"siteName": "Test Site", "primaryColor": "#ff0000"}' | jq .
   
   # Verify update
   curl -s http://localhost:3100/api/branding | jq '.branding.siteName'
   
   # Stop server
   kill $SERVER_PID
   ```

2. **File Upload Tests**
   ```bash
   # Create test image
   echo "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='red'/></svg>" > test-logo.svg
   
   # Test file upload
   curl -s -X POST http://localhost:3100/api/branding/upload \
     -F "file=@test-logo.svg" \
     -F "type=logo" | jq .
   
   # Verify file was saved
   ls -la uploads/branding/
   
   # Clean up
   rm test-logo.svg
   ```

#### 4.3 Integration Testing

1. **End-to-End Branding Flow**
   ```bash
   # Test complete branding workflow
   echo "Testing complete branding workflow..."
   
   # 1. Get initial branding
   INITIAL=$(curl -s http://localhost:3100/api/branding)
   echo "Initial branding: $INITIAL"
   
   # 2. Update branding
   UPDATE_RESULT=$(curl -s -X PUT http://localhost:3100/api/branding \
     -H "Content-Type: application/json" \
     -d '{"siteName": "Updated Site", "primaryColor": "#00ff00"}')
   echo "Update result: $UPDATE_RESULT"
   
   # 3. Verify changes persisted
   FINAL=$(curl -s http://localhost:3100/api/branding)
   echo "Final branding: $FINAL"
   
   # 4. Check database directly
   psql $DATABASE_URL -c "SELECT site_name, primary_color FROM branding WHERE is_active = true;"
   ```

### Phase 5: Troubleshooting Guide

#### 5.1 Common Issues & Solutions

**Issue: "Column does not exist" errors**
```bash
# Diagnosis
psql $DATABASE_URL -c "\d branding"  # Check actual table structure
cat src/db/schema/branding.ts | grep -A 5 -B 5 "siteName"  # Check schema mapping

# Solution
# Ensure column mapping is correct:
# Database: site_name (snake_case)
# Drizzle: siteName: varchar("site_name", ...)
```

**Issue: Migration fails**
```bash
# Diagnosis
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
psql $DATABASE_URL -c "SELECT * FROM information_schema.tables WHERE table_name = 'branding';"

# Solution
# Drop existing table if corrupted
psql $DATABASE_URL -c "DROP TABLE IF EXISTS branding CASCADE;"
# Re-run migration
psql $DATABASE_URL -f migrations/002_create_branding_system.sql
```

**Issue: File uploads fail**
```bash
# Diagnosis
ls -la uploads/  # Check directory permissions
df -h .  # Check disk space

# Solution
mkdir -p uploads/branding
chmod 755 uploads/branding
```

**Issue: Drizzle generates wrong SQL**
```bash
# Diagnosis
# Enable Drizzle logging in db/index.ts:
# const db = drizzle(connection, { schema, logger: true });

# Check generated queries in console
pnpm dev
# Make API call and check logs
```

#### 5.2 Validation Checklist

**Before Going Live:**
- [ ] Database schema matches Drizzle ORM exactly
- [ ] All API endpoints return 200 status codes
- [ ] File uploads work and files are accessible
- [ ] Branding changes reflect immediately in database
- [ ] No console errors in browser or server
- [ ] All constraints and triggers work correctly
- [ ] Default branding configuration exists
- [ ] Only one active branding configuration at a time

**Performance Checks:**
- [ ] API responses under 200ms
- [ ] File uploads under 5 seconds for 5MB files
- [ ] Database queries use proper indexes
- [ ] No N+1 query problems

**Security Checks:**
- [ ] File upload validation works
- [ ] SQL injection protection in place
- [ ] Authentication required for admin operations
- [ ] File access controls working

### Phase 6: Monitoring & Maintenance

#### 6.1 Health Checks

1. **Database Health**
   ```bash
   # Check table sizes
   psql $DATABASE_URL -c "SELECT 
     schemaname,
     tablename,
     attname,
     n_distinct,
     correlation
   FROM pg_stats 
   WHERE tablename IN ('branding', 'files');"
   
   # Check index usage
   psql $DATABASE_URL -c "SELECT 
     indexrelname,
     idx_tup_read,
     idx_tup_fetch
   FROM pg_stat_user_indexes 
   WHERE schemaname = 'public';"
   ```

2. **File System Health**
   ```bash
   # Check upload directory size
   du -sh uploads/
   
   # Check for orphaned files
   find uploads/ -type f -mtime +30 -exec ls -la {} \;
   
   # Verify file integrity
   find uploads/ -type f -exec file {} \; | grep -v "image\|PDF\|text"
   ```

#### 6.2 Backup Procedures

1. **Database Backup**
   ```bash
   # Daily backup
   pg_dump $DATABASE_URL > backups/db-$(date +%Y%m%d).sql
   
   # Compress old backups
   find backups/ -name "*.sql" -mtime +7 -exec gzip {} \;
   
   # Clean old backups
   find backups/ -name "*.sql.gz" -mtime +30 -delete
   ```

2. **File Backup**
   ```bash
   # Backup uploads directory
   tar -czf backups/uploads-$(date +%Y%m%d).tar.gz uploads/
   
   # Sync to remote storage (if configured)
   # rsync -av uploads/ user@backup-server:/backups/uploads/
   ```

## Files to Review/Recreate

### Delete These Files (After Reset)
- `migrations/002_create_branding_table.sql`
- `migrations/003_fix_branding_schema.sql`
- `migrations/004_fix_branding_column_names.sql`
- `src/routes/api.test-branding.ts` (debug file)
- `drizzle/schema.ts` (will be regenerated)

### Recreate These Files (In Order)
1. `src/db/schema/branding.ts` (with proper column mapping)
2. `src/db/schema/files.ts` (file system schema)
3. `src/db/schema/index.ts` (export all schemas)
4. `migrations/002_create_branding_system.sql` (single clean migration)
5. `migrations/003_create_file_system.sql` (file system migration)
6. `src/lib/services/branding.ts` (service layer)
7. `src/lib/services/file-storage.ts` (file service)
8. `src/routes/api.branding.ts` (clean API implementation)
9. `src/routes/api.branding.upload.ts` (file upload API)
10. `src/routes/api.files.upload.ts` (general file upload)
11. `src/contexts/branding-context.tsx` (React context)
12. `src/components/branding/` (UI components - implement after API works)

### Configuration Files to Update
- `src/db/index.ts` (add logging configuration)
- `vite.config.ts` (ensure static file serving for uploads)
- `.gitignore` (add uploads/ directory)
- `package.json` (ensure all dependencies are listed)

## Success Criteria

- [ ] Database schema matches Drizzle ORM exactly
- [ ] All API endpoints return proper responses
- [ ] No PostgreSQL column errors
- [ ] Branding changes reflect in UI immediately
- [ ] File uploads work correctly
- [ ] Admin can manage all branding settings
- [ ] Application loads without errors

## Next Steps

1. Execute git reset to clean state
2. Drop and recreate database
3. Implement branding system with proper schema design
4. Test thoroughly before adding file manager
5. Add file manager system incrementally
6. Document all changes and decisions

---

**Note**: This reset will lose current branding and file manager work, but will provide a solid foundation for proper implementation without the current schema conflicts and technical debt.
