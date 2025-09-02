import { createServerFileRoute } from '@tanstack/react-start/server';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

// Base uploads directory
const UPLOADS_BASE = path.join(process.cwd(), 'public', 'uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await mkdir(UPLOADS_BASE, { recursive: true });
    await mkdir(path.join(UPLOADS_BASE, 'images'), { recursive: true });
    await mkdir(path.join(UPLOADS_BASE, 'fonts'), { recursive: true });
    await mkdir(path.join(UPLOADS_BASE, 'documents'), { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
}

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  url?: string;
  mimeType?: string;
  createdAt?: string;
  modifiedAt?: string;
}

export const ServerRoute = createServerFileRoute('/api/files').methods({
  GET: async ({ request }) => {
    try {
      await ensureUploadsDir();
      
      const url = new URL(request.url);
      const requestedPath = url.searchParams.get('path') || '/';
      
      // Sanitize the path to prevent directory traversal
      const sanitizedPath = requestedPath.replace(/\.\./g, '').replace(/\/+/g, '/');
      const fullPath = path.join(UPLOADS_BASE, sanitizedPath === '/' ? '' : sanitizedPath);
      
      // Ensure the path is within uploads directory
      const resolvedPath = path.resolve(fullPath);
      const resolvedBase = path.resolve(UPLOADS_BASE);
      
      if (!resolvedPath.startsWith(resolvedBase)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid path' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const items: FileItem[] = [];
      
      try {
        const entries = await readdir(resolvedPath);
        
        for (const entry of entries) {
          const entryPath = path.join(resolvedPath, entry);
          const entryStats = await stat(entryPath);
          const relativePath = path.relative(UPLOADS_BASE, entryPath).replace(/\\/g, '/');
          
          const fileItem: FileItem = {
            id: Buffer.from(entryPath).toString('base64'),
            name: entry,
            type: entryStats.isDirectory() ? 'folder' : 'file',
            path: `/${relativePath}`,
            createdAt: entryStats.birthtime.toISOString(),
            modifiedAt: entryStats.mtime.toISOString(),
          };
          
          if (entryStats.isFile()) {
            fileItem.size = entryStats.size;
            fileItem.url = `/uploads/${relativePath}`;
            
            // Determine MIME type based on extension
            const ext = path.extname(entry).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
              fileItem.mimeType = `image/${ext.slice(1)}`;
            } else if (['.woff', '.woff2', '.ttf', '.otf'].includes(ext)) {
              fileItem.mimeType = 'font/' + ext.slice(1);
            } else if (['.pdf'].includes(ext)) {
              fileItem.mimeType = 'application/pdf';
            } else {
              fileItem.mimeType = 'application/octet-stream';
            }
          }
          
          items.push(fileItem);
        }
        
        // Sort: folders first, then files, alphabetically
        items.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        
      } catch (error) {
        if ((error as any).code === 'ENOENT') {
          // Directory doesn't exist, return empty array
          console.log('Directory does not exist:', resolvedPath);
        } else {
          throw error;
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            path: sanitizedPath,
            files: items,
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error reading files:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to read files' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      await ensureUploadsDir();
      
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const uploadPath = formData.get('path') as string || '/';
      const category = formData.get('category') as string || 'documents';
      
      if (!file) {
        return new Response(
          JSON.stringify({ success: false, error: 'No file provided' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Determine target directory based on category
      let targetDir = '';
      if (category === 'images' || file.type.startsWith('image/')) {
        targetDir = 'images';
      } else if (category === 'fonts' || file.type.startsWith('font/') || 
                 ['.woff', '.woff2', '.ttf', '.otf'].some(ext => file.name.toLowerCase().endsWith(ext))) {
        targetDir = 'fonts';
      } else {
        targetDir = 'documents';
      }
      
      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const timestamp = Date.now();
      const fileName = `${timestamp}_${sanitizedName}`;
      
      const targetPath = path.join(UPLOADS_BASE, targetDir, fileName);
      
      // Write file to disk
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(targetPath, buffer);
      
      const fileUrl = `/uploads/${targetDir}/${fileName}`;
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: Buffer.from(targetPath).toString('base64'),
            name: fileName,
            originalName: file.name,
            type: 'file',
            path: `/${targetDir}/${fileName}`,
            url: fileUrl,
            size: file.size,
            mimeType: file.type,
            category: targetDir,
            createdAt: new Date().toISOString(),
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to upload file' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const filePath = url.searchParams.get('path');
      
      if (!filePath) {
        return new Response(
          JSON.stringify({ success: false, error: 'File path is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const fullPath = path.join(UPLOADS_BASE, filePath);
      const resolvedPath = path.resolve(fullPath);
      const resolvedBase = path.resolve(UPLOADS_BASE);
      
      // Ensure the path is within uploads directory
      if (!resolvedPath.startsWith(resolvedBase)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid path' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Delete the file
      await promisify(fs.unlink)(resolvedPath);
      
      return new Response(
        JSON.stringify({ success: true, message: 'File deleted successfully' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete file' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});