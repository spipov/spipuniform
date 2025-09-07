import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { FileManagerProvider, useFileManager } from './file-manager-provider';
import { FolderTreeSidebar } from './folder-tree-sidebar';
import { NavigationHeader } from './navigation-header';
import { FileViewContainer } from './file-view-container';
import type { FileItem, FileListResponse } from '@/db/schema';

interface FileManagerProps {
  className?: string;
}

function FileManagerContent({ className }: FileManagerProps) {
  const { state, navigateToPath, dispatch, addFile, removeFile, updateFile, setLoading, setError } = useFileManager();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dialog states
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState('');
  const [folderToCreate, setFolderToCreate] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  // Fetch files for current path
  const { data: filesData, isLoading, refetch } = useQuery<FileListResponse>({
    queryKey: ['files', state.currentPath, state.searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        path: state.currentPath,
        ...(state.searchQuery && { search: state.searchQuery }),
      });

      const response = await fetch(`/api/files?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: true,
  });

  // Update state when data changes
  useEffect(() => {
    if (filesData) {
      dispatch({ type: 'SET_FILES', payload: filesData.files });
    }
    setLoading(isLoading);
  }, [filesData, isLoading, dispatch, setLoading]);

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      // console.log('FileManager: Starting upload - files:', Array.from(files).map(f => f.name), 'to path:', state.currentPath);
      
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('path', state.currentPath);

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      // console.log('FileManager: Upload response status:', response.status);
      
      const result = await response.json();
      // console.log('FileManager: Upload result:', result);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Add uploaded files to state
      data.uploadedFiles.forEach((file: FileItem) => addFile(file));
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success(`Successfully uploaded ${data.uploadedFiles.length} file(s)`);
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} file(s) failed to upload`);
      }
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Upload failed');
      toast.error('Failed to upload files');
    },
  });

  // File deletion mutation
  const deleteMutation = useMutation({
    mutationFn: async (filePath: string) => {
      // console.log('FileManager: Starting delete for path:', filePath);
      
      const response = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
      });

      // console.log('FileManager: Delete response status:', response.status);
      
      const result = await response.json();
      // console.log('FileManager: Delete result:', result);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (_, filePath) => {
      // console.log('FileManager: Delete success callback - filePath:', filePath);
      // Find the file by path to get id
      const file = state.files.find(f => f.path === filePath);
      if (file) {
        removeFile(file.id);
      }
      setFileToDelete(null);
      // Force refetch the current path
      queryClient.invalidateQueries({ queryKey: ['files', state.currentPath, state.searchQuery] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      refetch();
      toast.success('File deleted successfully');
    },
  });

  // File update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; [key: string]: unknown } }) => {
      // console.log('FileManager: Starting rename for id:', id, 'data:', data);
      
      const response = await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });

      // console.log('FileManager: Rename response status:', response.status);
      
      const result = await response.json();
      // console.log('FileManager: Rename result:', result);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (updatedFile) => {
      // console.log('FileManager: Rename success callback - updatedFile:', updatedFile);
      updateFile(updatedFile);
      setFileToRename(null);
      setNewName('');
      // Force refetch the current path
      queryClient.invalidateQueries({ queryKey: ['files', state.currentPath, state.searchQuery] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      refetch();
      toast.success('File renamed successfully');
    },
  });

  // Folder creation mutation
  const createFolderMutation = useMutation({
    mutationFn: async ({ name, path }: { name: string; path: string }) => {
      // console.log('FileManager: Starting folder creation - name:', name, 'path:', path);
      
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          path,
        }),
      });

      // console.log('FileManager: Create folder response status:', response.status);
      
      const result = await response.json();
      // console.log('FileManager: Create folder result:', result);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (newFolder) => {
      // console.log('FileManager: Create folder success callback - newFolder:', newFolder);
      addFile(newFolder);
      setFolderToCreate(null);
      setNewFolderName('');
      // Force refetch the current path
      queryClient.invalidateQueries({ queryKey: ['files', state.currentPath, state.searchQuery] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      refetch();
      toast.success('Folder created successfully');
    },
  });

  // Event handlers
  const handleNavigate = (file: FileItem) => {
    if (file.type === 'folder') {
      const newPath = file.path === '/uploads' ? `/uploads/${file.name}` : `${file.path}/${file.name}`;
      navigateToPath(newPath);
    } else {
      // Handle file download or preview
      if (file.url) {
        window.open(file.url, '_blank');
      }
    }
  };

  const handleDownload = (file: FileItem) => {
    if (file.url) {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = (file: FileItem) => {
    // console.log('FileManager: Delete button clicked for file:', file);
    setFileToDelete(file);
  };

  const handleDeleteById = (fileId: string) => {
    // console.log('FileManager: Delete by ID clicked for fileId:', fileId);
    const file = state.files.find(f => f.id === fileId);
    if (file) {
      setFileToDelete(file);
    }
  };

  const handleRename = (file: FileItem) => {
    // console.log('FileManager: Rename button clicked for file:', file);
    setFileToRename(file);
    setNewName(file.name);
  };

  const handleMove = (file: FileItem) => {
    // TODO: Implement move functionality with folder picker
    // console.log('Move file:', file);
  };

  const handleCreateFolder = (parentPath?: string) => {
    const path = parentPath || state.currentPath;
    // console.log('FileManager: Create folder button clicked for path:', path);
    setFolderToCreate(path);
    setNewFolderName('');
  };

  const handleFilesDrop = (files: FileList) => {
    // console.log('FileManager: Files dropped:', Array.from(files).map(f => f.name));
    uploadMutation.mutate(files);
  };

  const confirmDelete = () => {
    // console.log('FileManager: Confirm delete clicked for file:', fileToDelete);
    if (fileToDelete) {
      deleteMutation.mutate(fileToDelete.path);
    }
  };

  const confirmRename = () => {
    // console.log('FileManager: Confirm rename clicked - file:', fileToRename, 'newName:', newName);
    if (fileToRename && newName.trim()) {
      updateMutation.mutate({
        id: fileToRename.id,
        data: { name: newName.trim() },
      });
    }
  };

  const confirmCreateFolder = () => {
    // console.log('FileManager: Confirm create folder clicked - path:', folderToCreate, 'name:', newFolderName);
    if (folderToCreate && newFolderName.trim()) {
      createFolderMutation.mutate({
        name: newFolderName.trim(),
        path: folderToCreate,
      });
    }
  };

  return (
    <div className={cn("flex h-full bg-white", className)}>
      {/* Sidebar */}
      {(!isMobile || sidebarOpen) && (
        <FolderTreeSidebar
          className={cn(
            "w-70", // 280px
            isMobile && "fixed left-0 top-0 h-full z-50 shadow-lg"
          )}
          onCreateFolder={handleCreateFolder}
          onDelete={handleDeleteById}
          onRename={handleRename}
        />
      )}

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col min-w-0", isMobile && "ml-0")}>
        {/* Header */}
        <NavigationHeader
          onUpload={handleFilesDrop}
          onCreateFolder={() => handleCreateFolder()}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle={isMobile}
        />

        {/* File View */}
        <FileViewContainer
          onNavigate={handleNavigate}
          onDownload={handleDownload}
          onRename={handleRename}
          onMove={handleMove}
          onDelete={handleDelete}
          onFilesDrop={handleFilesDrop}
        />
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{fileToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={!!fileToRename} onOpenChange={() => setFileToRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {fileToRename?.type}</DialogTitle>
            <DialogDescription>
              Enter a new name for "{fileToRename?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileToRename(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmRename}
              disabled={updateMutation.isPending || !newName.trim()}
            >
              {updateMutation.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={!!folderToCreate} onOpenChange={() => setFolderToCreate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder-name" className="text-right">
                Name
              </Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderToCreate(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmCreateFolder}
              disabled={createFolderMutation.isPending || !newFolderName.trim()}
            >
              {createFolderMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FileManager({ className }: FileManagerProps) {
  return (
    <FileManagerProvider>
      <FileManagerContent className={className} />
    </FileManagerProvider>
  );
}

export default FileManager;