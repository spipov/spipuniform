import { createServerFileRoute } from '@tanstack/react-start/server';
import { FileService } from '@/lib/services/file-system';
import { updateFileSchema } from '@/db/schema/file-system';
import * as v from 'valibot';

export const ServerRoute = createServerFileRoute('/api/files').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const path = url.searchParams.get('path') || '/';
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const type = url.searchParams.get('type') as 'file' | 'folder' | undefined;
      const userId = url.searchParams.get('userId') || undefined;
      const search = url.searchParams.get('search');

      // If search query is provided, use search functionality
      if (search) {
        const searchResults = await FileService.searchFiles(search, {
          path: path !== '/' ? path : undefined,
          userId,
          type,
          limit,
        });
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            files: searchResults,
            totalCount: searchResults.length,
            hasMore: false,
            currentPath: path,
          }
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Regular file listing
      const result = await FileService.listFiles(path, {
        page,
        limit,
        type,
        userId,
      });

      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching files:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch files' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const contentType = request.headers.get('content-type') || '';

      if (contentType.includes('multipart/form-data')) {
        // Handle file upload
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const path = formData.get('path') as string || '/';
        const ownerId = formData.get('ownerId') as string || undefined;

        if (!files || files.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'No files provided' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Convert File objects to FileUpload format
        const fileUploads = await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            data: Buffer.from(await file.arrayBuffer()),
            mimeType: file.type,
            size: file.size,
          }))
        );

        const result = await FileService.uploadFiles(fileUploads, {
          path,
          ownerId,
        });

        return new Response(JSON.stringify({ success: true, data: result }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        // Handle folder creation
        const body = await request.json();
        const { name, path = '/', ownerId, type } = body;

        if (!name) {
          return new Response(
            JSON.stringify({ success: false, error: 'Name is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (type === 'folder') {
          const folder = await FileService.createFolder(name, path, ownerId);
          return new Response(JSON.stringify({ success: true, data: folder }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(
          JSON.stringify({ success: false, error: 'Invalid file type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Error in file operation:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'File operation failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PUT: async ({ request }) => {
    try {
      const body = await request.json();
      const { id, action, ...updateData } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'File ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      let result;

      switch (action) {
        case 'move': {
          if (!updateData.newPath) {
            return new Response(
              JSON.stringify({ success: false, error: 'New path is required for move operation' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }
          result = await FileService.moveFile(id, updateData.newPath, updateData.userId);
          break;
        }
        default: {
          // Regular file update
          const validatedData = v.parse(updateFileSchema, updateData);
          result = await FileService.updateFile(id, validatedData, updateData.userId);
        }
      }

      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error updating file:', error);
      
      if (error instanceof v.ValiError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Validation failed', details: error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update file' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      const userId = url.searchParams.get('userId') || undefined;

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'File ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const deleted = await FileService.deleteFile(id, userId);

      if (!deleted) {
        return new Response(
          JSON.stringify({ success: false, error: 'File not found or could not be deleted' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ success: true, message: 'File deleted successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete file' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});