import { createServerFileRoute } from '@tanstack/react-start/server';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);
const rename = promisify(fs.rename);
const rm = promisify(fs.rm);

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
      
      console.log('GET /api/files requested path:', requestedPath);
      
      // Sanitize the path to prevent directory traversal
      const sanitizedPath = requestedPath.replace(/\.\./g, '').replace(/\/+/g, '/');
      console.log('Sanitized path:', sanitizedPath);
      
      const fullPath = path.join(UPLOADS_BASE, sanitizedPath === '/' ? '' : sanitizedPath);
      console.log('Full path:', fullPath);
      
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
      const files = formData.getAll('files') as File[];
      const uploadPath = formData.get('path') as string || '/';
      const category = formData.get('category') as string || 'documents';

      if (!files || files.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'No files provided' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const uploadedFiles: any[] = [];
      const errors: string[] = [];

      for (const file of files) {
        try {
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

          uploadedFiles.push({
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
          });
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError);
          errors.push(`Failed to upload ${file.name}`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            uploadedFiles,
            errors,
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error uploading files:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to upload files' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const filePath = url.searchParams.get('path');

      console.log('DELETE /api/files requested path:', filePath);

      if (!filePath) {
        return new Response(
          JSON.stringify({ success: false, error: 'File path is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Sanitize the file path
      const sanitizedPath = filePath.replace(/\.\./g, '').replace(/\/+/g, '/');
      const fullPath = path.join(UPLOADS_BASE, sanitizedPath);
      const resolvedPath = path.resolve(fullPath);
      const resolvedBase = path.resolve(UPLOADS_BASE);

      console.log('Delete full path:', fullPath);
      console.log('Delete resolved path:', resolvedPath);

      // Ensure the path is within uploads directory
      if (!resolvedPath.startsWith(resolvedBase)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid path' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if file exists and get its type
      let stats;
      try {
        stats = await stat(resolvedPath);
      } catch (accessError) {
        return new Response(
          JSON.stringify({ success: false, error: 'File not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('File stats:', { isDirectory: stats.isDirectory(), isFile: stats.isFile() });

      // Use the modern fs.rm method which handles both files and directories
      console.log('Deleting:', resolvedPath, 'isDirectory:', stats.isDirectory());
      try {
        await rm(resolvedPath, { recursive: true, force: true });
        console.log('Successfully deleted:', resolvedPath);
      } catch (error: any) {
        console.error('Error deleting:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'File deleted successfully' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to delete file: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PUT: async ({ request }) => {
    try {
      await ensureUploadsDir();

      const { path: folderPath, name } = await request.json();

      if (!name || !name.trim()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Folder name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Sanitize the path and name
      const sanitizedPath = (folderPath || '/').replace(/\.\./g, '').replace(/\/+/g, '/');
      const sanitizedName = name.trim().replace(/[^a-zA-Z0-9.\-_]/g, '_');

      const fullPath = path.join(UPLOADS_BASE, sanitizedPath === '/' ? '' : sanitizedPath, sanitizedName);
      const resolvedPath = path.resolve(fullPath);
      const resolvedBase = path.resolve(UPLOADS_BASE);

      // Ensure the path is within uploads directory
      if (!resolvedPath.startsWith(resolvedBase)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid path' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Create the folder
      await mkdir(resolvedPath, { recursive: true });

      const relativePath = path.relative(UPLOADS_BASE, resolvedPath).replace(/\\/g, '/');

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: Buffer.from(resolvedPath).toString('base64'),
            name: sanitizedName,
            type: 'folder',
            path: `/${relativePath}`,
            createdAt: new Date().toISOString(),
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error creating folder:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create folder' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PATCH: async ({ request }) => {
    try {
      const { id, name } = await request.json();

      console.log('PATCH /api/files requested id:', id, 'new name:', name);

      if (!id || !name || !name.trim()) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID and name are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Decode the base64 ID to get the file path
      let oldPath: string;
      try {
        oldPath = Buffer.from(id, 'base64').toString('utf-8');
        console.log('Decoded path from ID:', oldPath);
      } catch (decodeError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid file ID' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const resolvedOldPath = path.resolve(oldPath);
      const resolvedBase = path.resolve(UPLOADS_BASE);

      // Ensure the path is within uploads directory
      if (!resolvedOldPath.startsWith(resolvedBase)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid path' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if file exists
      try {
        await access(resolvedOldPath, fs.constants.F_OK);
      } catch (accessError) {
        return new Response(
          JSON.stringify({ success: false, error: 'File not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Create new path with new name
      const parentDir = path.dirname(resolvedOldPath);
      const sanitizedName = name.trim().replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const newPath = path.join(parentDir, sanitizedName);

      console.log('Renaming from:', resolvedOldPath, 'to:', newPath);

      // Perform the rename
      await rename(resolvedOldPath, newPath);

      // Get file stats for response
      const stats = await stat(newPath);
      const relativePath = path.relative(UPLOADS_BASE, newPath).replace(/\\/g, '/');

      const updatedFile = {
        id: Buffer.from(newPath).toString('base64'),
        name: sanitizedName,
        type: stats.isDirectory() ? 'folder' : 'file',
        path: `/${relativePath}`,
        ...(stats.isFile() && {
          size: stats.size,
          url: `/uploads/${relativePath}`,
        }),
        modifiedAt: stats.mtime.toISOString(),
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: updatedFile,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error renaming file:', error);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to rename file: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});