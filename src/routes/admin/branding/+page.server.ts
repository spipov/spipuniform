import { BrandingService } from '@/lib/services/branding/branding-service';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const load: PageServerLoad = async () => {
  try {
    const [activeBranding, allBranding] = await Promise.all([
      BrandingService.getActiveBranding(),
      BrandingService.getAllBranding()
    ]);

    return {
      activeBranding,
      allBranding
    };
  } catch (error) {
    console.error('Error loading branding data:', error);
    return {
      activeBranding: null,
      allBranding: []
    };
  }
};

export const actions: Actions = {
  create: async ({ request }) => {
    try {
      const formData = await request.formData();
      const logoFile = formData.get('logoFile') as File;
      const faviconFile = formData.get('faviconFile') as File;
      
      let logoUrl = formData.get('logoUrl') as string;
      let faviconUrl = formData.get('faviconUrl') as string;
      
      // Handle logo file upload
      if (logoFile && logoFile.size > 0) {
        logoUrl = await uploadFile(logoFile, 'logos');
      }
      
      // Handle favicon file upload
      if (faviconFile && faviconFile.size > 0) {
        faviconUrl = await uploadFile(faviconFile, 'favicons');
      }
      
      const brandingData = {
        siteName: formData.get('siteName') as string,
        siteDescription: formData.get('siteDescription') as string,
        siteUrl: formData.get('siteUrl') as string,
        logoUrl,
        faviconUrl,
        primaryColor: formData.get('primaryColor') as string,
        secondaryColor: formData.get('secondaryColor') as string,
        accentColor: formData.get('accentColor') as string,
        fontFamily: formData.get('fontFamily') as string,
        fontSize: formData.get('fontSize') as string,
        lineHeight: formData.get('lineHeight') as string,
        headerLayout: formData.get('headerLayout') as string,
        footerLayout: formData.get('footerLayout') as string,
        sidebarPosition: formData.get('sidebarPosition') as string,
        contactEmail: formData.get('contactEmail') as string,
        supportEmail: formData.get('supportEmail') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        address: formData.get('address') as string,
        facebookUrl: formData.get('facebookUrl') as string,
        twitterUrl: formData.get('twitterUrl') as string,
        linkedinUrl: formData.get('linkedinUrl') as string,
        instagramUrl: formData.get('instagramUrl') as string,
        youtubeUrl: formData.get('youtubeUrl') as string,
        customCss: formData.get('customCss') as string,
        isActive: formData.get('isActive') === 'true'
      };
      
      await BrandingService.createBranding(brandingData);
      
      return {
        success: true,
        message: 'Branding configuration created successfully'
      };
    } catch (error) {
      console.error('Error creating branding:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to create branding configuration'
      });
    }
  },

  update: async ({ request }) => {
    try {
      const formData = await request.formData();
      const id = formData.get('id') as string;
      const logoFile = formData.get('logoFile') as File;
      const faviconFile = formData.get('faviconFile') as File;
      
      let logoUrl = formData.get('logoUrl') as string;
      let faviconUrl = formData.get('faviconUrl') as string;
      
      // Handle logo file upload
      if (logoFile && logoFile.size > 0) {
        logoUrl = await uploadFile(logoFile, 'logos');
      }
      
      // Handle favicon file upload
      if (faviconFile && faviconFile.size > 0) {
        faviconUrl = await uploadFile(faviconFile, 'favicons');
      }
      
      const brandingData = {
        siteName: formData.get('siteName') as string,
        siteDescription: formData.get('siteDescription') as string,
        siteUrl: formData.get('siteUrl') as string,
        logoUrl,
        faviconUrl,
        primaryColor: formData.get('primaryColor') as string,
        secondaryColor: formData.get('secondaryColor') as string,
        accentColor: formData.get('accentColor') as string,
        fontFamily: formData.get('fontFamily') as string,
        fontSize: formData.get('fontSize') as string,
        lineHeight: formData.get('lineHeight') as string,
        headerLayout: formData.get('headerLayout') as string,
        footerLayout: formData.get('footerLayout') as string,
        sidebarPosition: formData.get('sidebarPosition') as string,
        contactEmail: formData.get('contactEmail') as string,
        supportEmail: formData.get('supportEmail') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        address: formData.get('address') as string,
        facebookUrl: formData.get('facebookUrl') as string,
        twitterUrl: formData.get('twitterUrl') as string,
        linkedinUrl: formData.get('linkedinUrl') as string,
        instagramUrl: formData.get('instagramUrl') as string,
        youtubeUrl: formData.get('youtubeUrl') as string,
        customCss: formData.get('customCss') as string,
        isActive: formData.get('isActive') === 'true'
      };
      
      await BrandingService.updateBranding(id, brandingData);
      
      return {
        success: true,
        message: 'Branding configuration updated successfully'
      };
    } catch (error) {
      console.error('Error updating branding:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to update branding configuration'
      });
    }
  },

  delete: async ({ request }) => {
    try {
      const formData = await request.formData();
      const id = formData.get('id') as string;
      
      await BrandingService.deleteBranding(id);
      
      return {
        success: true,
        message: 'Branding configuration deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting branding:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to delete branding configuration'
      });
    }
  },

  activate: async ({ request }) => {
    try {
      const formData = await request.formData();
      const id = formData.get('id') as string;
      
      await BrandingService.activateBranding(id);
      
      return {
        success: true,
        message: 'Branding configuration activated successfully'
      };
    } catch (error) {
      console.error('Error activating branding:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to activate branding configuration'
      });
    }
  },

  deactivate: async ({ request }) => {
    try {
      const formData = await request.formData();
      const id = formData.get('id') as string;
      
      await BrandingService.deactivateBranding(id);
      
      return {
        success: true,
        message: 'Branding configuration deactivated successfully'
      };
    } catch (error) {
      console.error('Error deactivating branding:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to deactivate branding configuration'
      });
    }
  },

  ensureDefault: async () => {
    try {
      await BrandingService.ensureDefaultBranding();
      
      return {
        success: true,
        message: 'Default branding configuration ensured'
      };
    } catch (error) {
      console.error('Error ensuring default branding:', error);
      return fail(400, {
        error: error instanceof Error ? error.message : 'Failed to ensure default branding configuration'
      });
    }
  }
};

/**
 * Upload file to static directory
 */
async function uploadFile(file: File, subfolder: string): Promise<string> {
  try {
    const uploadDir = join(process.cwd(), 'static', 'uploads', subfolder);
    
    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}.${extension}`;
    const filepath = join(uploadDir, filename);
    
    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);
    
    // Return public URL
    return `/uploads/${subfolder}/${filename}`;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}