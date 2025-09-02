import { pgTable, text, boolean, timestamp, uuid, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';
import * as v from 'valibot';

// Branding table schema
export const branding = pgTable(
  'branding',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Site Information
    siteName: text('site_name').notNull(),
    siteDescription: text('site_description'),
    siteUrl: text('site_url'),
    
    // Logo Configuration
    logoUrl: text('logo_url'),
    logoAlt: text('logo_alt'),
    faviconUrl: text('favicon_url'),
    
    // Color Scheme
    primaryColor: text('primary_color').default('#3b82f6'),
    secondaryColor: text('secondary_color').default('#64748b'),
    accentColor: text('accent_color').default('#f59e0b'),
    backgroundColor: text('background_color').default('#ffffff'),
    textColor: text('text_color').default('#1f2937'),
    
    // Typography
    fontFamily: text('font_family').default('Inter, sans-serif'),
    headingFont: text('heading_font'),
    // customFonts: jsonb('custom_fonts').$type<{
    //   [fontName: string]: {
    //     url: string;
    //     format: string;
    //     weight?: string;
    //     style?: string;
    //   };
    // }>(),
    
    // Layout & Styling
    borderRadius: text('border_radius').default('0.5rem'),
    spacing: text('spacing').default('1rem'),
    
    // Contact Information
    supportEmail: text('support_email'),
    contactPhone: text('contact_phone'),
    
    // Social Media
    socialLinks: jsonb('social_links').$type<{
      twitter?: string;
      facebook?: string;
      linkedin?: string;
      instagram?: string;
      github?: string;
    }>(),
    
    // Custom CSS/Styling
    customCss: text('custom_css'),
    
    // Status and Metadata
    isActive: boolean('is_active').default(true),
    version: text('version').default('1.0.0'),
    
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for performance
    activeIdx: index('branding_active_idx').on(table.isActive),
    createdAtIdx: index('branding_created_at_idx').on(table.createdAt),
  })
);

// Validation schemas
export const insertBrandingSchema = createInsertSchema(branding, {
  siteName: v.pipe(v.string(), v.minLength(1, 'Site name is required')),
  siteDescription: v.optional(v.string()),
  siteUrl: v.optional(v.pipe(v.string(), v.url('Must be a valid URL'))),
  logoUrl: v.optional(v.pipe(v.string(), v.url('Must be a valid URL'))),
  logoAlt: v.optional(v.string()),
  faviconUrl: v.optional(v.pipe(v.string(), v.url('Must be a valid URL'))),
  primaryColor: v.optional(v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'))),
  secondaryColor: v.optional(v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'))),
  accentColor: v.optional(v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'))),
  backgroundColor: v.optional(v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'))),
  textColor: v.optional(v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'))),
  fontFamily: v.optional(v.string()),
  headingFont: v.optional(v.string()),
  // customFonts: v.optional(v.record(v.string(), v.object({
  //   url: v.pipe(v.string(), v.url('Must be a valid URL')),
  //   format: v.string(),
  //   weight: v.optional(v.string()),
  //   style: v.optional(v.string()),
  // }))),
  borderRadius: v.optional(v.string()),
  spacing: v.optional(v.string()),
  supportEmail: v.optional(v.pipe(v.string(), v.email('Must be a valid email'))),
  contactPhone: v.optional(v.string()),
  socialLinks: v.optional(v.object({
    twitter: v.optional(v.pipe(v.string(), v.url('Must be a valid URL'))),
    facebook: v.optional(v.pipe(v.string(), v.url('Must be a valid URL'))),
    linkedin: v.optional(v.pipe(v.string(), v.url('Must be a valid URL'))),
    instagram: v.optional(v.pipe(v.string(), v.url('Must be a valid URL'))),
    github: v.optional(v.pipe(v.string(), v.url('Must be a valid URL'))),
  })),
  customCss: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  version: v.optional(v.string()),
});

export const selectBrandingSchema = createSelectSchema(branding);
export const updateBrandingSchema = v.partial(insertBrandingSchema);

// Types
export type Branding = typeof branding.$inferSelect;
export type NewBranding = typeof branding.$inferInsert;
export type UpdateBranding = v.InferInput<typeof updateBrandingSchema>;