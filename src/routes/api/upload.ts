import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { files } from '@/db/schema';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Validation schema
const uploadSchema = z.object({
  category: z.enum(['listing', 'profile', 'shop', 'document']).default('listing'),
  altText: z.string().optional()
});

// Helper function to get file extension
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Helper function to validate file type
const isValidImageType = (extension: string): boolean => {
  const validTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  return validTypes.includes(extension);
};

// Helper function to get MIME type
const getMimeType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif'
  };
  return mimeTypes[extension] || 'application/octet-stream';
};

export const ServerRoute = createServerFileRoute('/api/upload').methods({
  POST: async ({ request }) => {
    try {
      // Validate session using Better Auth
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const userId = session.user.id;
      
      // Parse multipart form data
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const category = formData.get('category') as string || 'listing';
      const altText = formData.get('altText') as string;

      // Validate inputs
      const validatedData = uploadSchema.parse({ category, altText });
      
      if (!file) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No file provided'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validate file
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return new Response(JSON.stringify({
          success: false,
          error: 'File size too large. Maximum size is 10MB.'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const fileExtension = getFileExtension(file.name);
      if (!isValidImageType(fileExtension)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid file type. Only JPG, PNG, WebP and GIF files are allowed.'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate unique filename
      const fileId = uuidv4();
      const fileName = `${fileId}.${fileExtension}`;
      const mimeType = getMimeType(fileExtension);

      // Create upload directory structure
      const uploadDir = join(process.cwd(), 'public', 'uploads', validatedData.category);
      const filePath = join(uploadDir, fileName);
      const publicPath = `/uploads/${validatedData.category}/${fileName}`;

      // Ensure directory exists
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Save file record to database
      const [fileRecord] = await db
        .insert(files)
        .values({
          id: fileId,
          uploadedBy: userId,
          originalName: file.name,
          filename: fileName,
          mimeType: mimeType,
          fileSize: file.size,
          filePath: publicPath,
          category: validatedData.category,
          altText: validatedData.altText,
          isPublic: true,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString()
          }
        })
        .returning();

      return new Response(JSON.stringify({
        success: true,
        file: {
          id: fileRecord.id,
          url: publicPath,
          filename: fileRecord.filename,
          originalName: fileRecord.originalName,
          mimeType: fileRecord.mimeType,
          fileSize: fileRecord.fileSize,
          altText: fileRecord.altText
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid parameters',
          details: error.errors
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to upload file'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});