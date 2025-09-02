import { db } from '@/db';
import { branding, type Branding, type NewBranding, type UpdateBranding } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import * as v from 'valibot';
import { insertBrandingSchema, updateBrandingSchema } from '@/db/schema/branding';

export class BrandingService {
  /**
   * Get the active branding configuration
   */
  static async getActiveBranding(): Promise<Branding | null> {
    try {
      const result = await db
        .select()
        .from(branding)
        .where(eq(branding.isActive, true))
        .orderBy(desc(branding.createdAt))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching active branding:', error);
      throw new Error('Failed to fetch active branding configuration');
    }
  }

  /**
   * Get all branding configurations
   */
  static async getAllBranding(): Promise<Branding[]> {
    try {
      return await db
        .select()
        .from(branding)
        .orderBy(desc(branding.createdAt));
    } catch (error) {
      console.error('Error fetching all branding configurations:', error);
      throw new Error('Failed to fetch branding configurations');
    }
  }

  /**
   * Get branding configuration by ID
   */
  static async getBrandingById(id: string): Promise<Branding | null> {
    try {
      const result = await db
        .select()
        .from(branding)
        .where(eq(branding.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching branding by ID:', error);
      throw new Error('Failed to fetch branding configuration');
    }
  }

  /**
   * Create a new branding configuration
   */
  static async createBranding(data: NewBranding): Promise<Branding> {
    try {
      // Validate input data
      const validatedData = v.parse(insertBrandingSchema, data);
      
      // If this is being set as active, deactivate all others first
      if (validatedData.isActive) {
        await this.deactivateAllBranding();
      }
      
      const result = await db
        .insert(branding)
        .values({
          ...validatedData,
          updatedAt: new Date(),
        })
        .returning();
      
      return result[0];
    } catch (error) {
      if (error instanceof v.ValiError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      console.error('Error creating branding:', error);
      throw new Error('Failed to create branding configuration');
    }
  }

  /**
   * Update an existing branding configuration
   */
  static async updateBranding(id: string, data: UpdateBranding): Promise<Branding> {
    try {
      // Validate input data
      const validatedData = v.parse(updateBrandingSchema, data);
      
      // Check if branding exists
      const existing = await this.getBrandingById(id);
      if (!existing) {
        throw new Error('Branding configuration not found');
      }
      
      // If this is being set as active, deactivate all others first
      if (validatedData.isActive) {
        await this.deactivateAllBranding();
      }
      
      const result = await db
        .update(branding)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(branding.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      if (error instanceof v.ValiError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      console.error('Error updating branding:', error);
      throw new Error('Failed to update branding configuration');
    }
  }

  /**
   * Delete a branding configuration
   */
  static async deleteBranding(id: string): Promise<boolean> {
    try {
      // Check if branding exists
      const existing = await this.getBrandingById(id);
      if (!existing) {
        throw new Error('Branding configuration not found');
      }
      
      // Don't allow deletion of active branding
      if (existing.isActive) {
        throw new Error('Cannot delete active branding configuration. Please activate another configuration first.');
      }
      
      await db
        .delete(branding)
        .where(eq(branding.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting branding:', error);
      throw error;
    }
  }

  /**
   * Activate a branding configuration (deactivates all others)
   */
  static async activateBranding(id: string): Promise<Branding> {
    try {
      // Check if branding exists
      const existing = await this.getBrandingById(id);
      if (!existing) {
        throw new Error('Branding configuration not found');
      }
      
      // Deactivate all branding configurations
      await this.deactivateAllBranding();
      
      // Activate the specified one
      const result = await db
        .update(branding)
        .set({
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(branding.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error activating branding:', error);
      throw new Error('Failed to activate branding configuration');
    }
  }

  /**
   * Deactivate all branding configurations
   */
  static async deactivateAllBranding(): Promise<void> {
    try {
      await db
        .update(branding)
        .set({
          isActive: false,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error deactivating all branding:', error);
      throw new Error('Failed to deactivate branding configurations');
    }
  }

  /**
   * Create default branding configuration if none exists
   */
  static async ensureDefaultBranding(): Promise<Branding> {
    try {
      const activeBranding = await this.getActiveBranding();
      
      if (!activeBranding) {
        const defaultBranding: NewBranding = {
          siteName: 'My Application',
          siteDescription: 'A modern web application',
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          accentColor: '#f59e0b',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '0.5rem',
          spacing: '1rem',
          isActive: true,
          version: '1.0.0',
        };
        
        return await this.createBranding(defaultBranding);
      }
      
      return activeBranding;
    } catch (error) {
      console.error('Error ensuring default branding:', error);
      throw new Error('Failed to create default branding configuration');
    }
  }

  /**
   * Get branding as CSS variables for frontend use
   */
  static async getBrandingCSSVariables(): Promise<Record<string, string>> {
    try {
      const activeBranding = await this.getActiveBranding();
      
      if (!activeBranding) {
        // Return default CSS variables if no branding is active
        return {
          '--primary-color': '#3b82f6',
          '--secondary-color': '#64748b',
          '--accent-color': '#f59e0b',
          '--background-color': '#ffffff',
          '--text-color': '#1f2937',
          '--font-family': 'Inter, sans-serif',
          '--border-radius': '0.5rem',
          '--spacing': '1rem',
        };
      }
      
      return {
        '--primary-color': activeBranding.primaryColor || '#3b82f6',
        '--secondary-color': activeBranding.secondaryColor || '#64748b',
        '--accent-color': activeBranding.accentColor || '#f59e0b',
        '--background-color': activeBranding.backgroundColor || '#ffffff',
        '--text-color': activeBranding.textColor || '#1f2937',
        '--font-family': this.getFontFamilyForCSS(activeBranding.fontFamily) || 'Inter, sans-serif',
        '--heading-font': this.getFontFamilyForCSS(activeBranding.headingFont) || this.getFontFamilyForCSS(activeBranding.fontFamily) || 'Inter, sans-serif',
        '--border-radius': activeBranding.borderRadius || '0.5rem',
        '--spacing': activeBranding.spacing || '1rem',
      };
    } catch (error) {
      console.error('Error getting branding CSS variables:', error);
      // Return default variables on error
      return {
        '--primary-color': '#3b82f6',
        '--secondary-color': '#64748b',
        '--accent-color': '#f59e0b',
        '--background-color': '#ffffff',
        '--text-color': '#1f2937',
        '--font-family': 'Inter, sans-serif',
        '--border-radius': '0.5rem',
        '--spacing': '1rem',
      };
    }
  }

  /**
   * Generate complete CSS including custom fonts and variables
   */
  static async generateBrandingCSS(): Promise<string> {
    try {
      const activeBranding = await this.getActiveBranding();
      const cssVariables = await this.getBrandingCSSVariables();
      
      let css = '';
      
      // Add CSS variables to :root
      const rootVariables = Object.entries(cssVariables)
        .map(([key, value]) => `  ${key}: ${value};`)
        .join('\n');
      
      css += `:root {\n${rootVariables}\n}\n\n`;
      
      // Add font imports/declarations
      if (activeBranding?.fontFamily) {
        if (this.isWebFont(activeBranding.fontFamily)) {
          css += `@import url('${this.generateFontImportUrl(activeBranding.fontFamily)}');\n\n`;
        } else if (this.isCustomFontFile(activeBranding.fontFamily)) {
          css += this.generateCustomFontFace(activeBranding.fontFamily, 'body-font');
        }
      }
      
      if (activeBranding?.headingFont && 
          activeBranding.headingFont !== activeBranding.fontFamily) {
        if (this.isWebFont(activeBranding.headingFont)) {
          css += `@import url('${this.generateFontImportUrl(activeBranding.headingFont)}');\n\n`;
        } else if (this.isCustomFontFile(activeBranding.headingFont)) {
          css += this.generateCustomFontFace(activeBranding.headingFont, 'heading-font');
        }
      }
      
      // Add ONLY font application - no colors, no layout changes
      css += `
/* Apply branding fonts only - minimal and safe */
body {
  font-family: var(--font-family), -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading-font), var(--font-family), -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
}`;

      return css;
    } catch (error) {
      console.error('Error generating branding CSS:', error);
      return '';
    }
  }

  /**
   * Check if a font family is a web font that needs importing
   */
  private static isWebFont(fontFamily: string): boolean {
    // Check if it's a Google Font or other web font
    const webFonts = [
      'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
      'Raleway', 'Poppins', 'Noto Sans', 'Ubuntu', 'Nunito', 'Playfair Display',
      'Merriweather', 'Lora', 'Oswald', 'PT Sans', 'Slabo 27px', 'Work Sans'
    ];
    return webFonts.some(webFont => fontFamily.includes(webFont));
  }

  /**
   * Generate Google Fonts import URL
   */
  private static generateFontImportUrl(fontFamily: string): string {
    // Extract font name and generate Google Fonts URL
    const fontName = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    const encodedFontName = fontName.replace(/\s+/g, '+');
    return `https://fonts.googleapis.com/css2?family=${encodedFontName}:wght@300;400;500;600;700&display=swap`;
  }

  /**
   * Check if a font is a custom font file
   */
  private static isCustomFontFile(fontFamily: string): boolean {
    // Check if it looks like a file name (contains numbers, underscores, or file extensions)
    return /\d|_|-/.test(fontFamily) && !this.isWebFont(fontFamily);
  }

  /**
   * Generate @font-face declaration for custom font files
   */
  private static generateCustomFontFace(fontFileName: string, familyName: string): string {
    // Extract file extension to determine format
    const fileExtension = fontFileName.split('.').pop()?.toLowerCase();
    let format = 'woff2';
    
    switch (fileExtension) {
      case 'woff':
        format = 'woff';
        break;
      case 'woff2':
        format = 'woff2';
        break;
      case 'otf':
        format = 'opentype';
        break;
      case 'ttf':
        format = 'truetype';
        break;
      default:
        // Try to guess from filename or default to woff2
        if (fontFileName.includes('woff2')) format = 'woff2';
        else if (fontFileName.includes('woff')) format = 'woff';
        else if (fontFileName.includes('otf')) format = 'opentype';
        else if (fontFileName.includes('ttf')) format = 'truetype';
        break;
    }

    // Clean font name for family declaration
    const cleanFontName = fontFileName
      .replace(/^\d+_/, '') // Remove timestamp prefix
      .replace(/\.(woff2|woff|otf|ttf)$/, '') // Remove extension
      .replace(/[-_]/g, ' '); // Replace dashes/underscores with spaces

    return `@font-face {
  font-family: '${cleanFontName}';
  src: url('/uploads/fonts/${fontFileName}') format('${format}');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

`;
  }

  /**
   * Get the proper font family name for CSS
   */
  private static getFontFamilyForCSS(fontFamily: string | null | undefined): string | null {
    if (!fontFamily) return null;
    
    // If it's a web font, return as-is
    if (this.isWebFont(fontFamily)) {
      return fontFamily;
    }
    
    // If it's a custom font file, return the cleaned name with quotes
    if (this.isCustomFontFile(fontFamily)) {
      const cleanFontName = fontFamily
        .replace(/^\d+_/, '') // Remove timestamp prefix
        .replace(/\.(woff2|woff|otf|ttf)$/, '') // Remove extension
        .replace(/[-_]/g, ' '); // Replace dashes/underscores with spaces
      
      return `'${cleanFontName}', sans-serif`;
    }
    
    // Return as-is for system fonts
    return fontFamily;
  }

  /**
   * Generate CSS for custom fonts (legacy method)
   */
  static async generateCustomFontCSS(): Promise<string> {
    const css = await this.generateBrandingCSS();
    // Extract only the font-face declarations
    const fontFaceRegex = /@font-face\s*{[^}]+}/g;
    const fontFaces = css.match(fontFaceRegex);
    return fontFaces ? fontFaces.join('\n\n') : '';
  }
}

// Export for convenience
export default BrandingService;