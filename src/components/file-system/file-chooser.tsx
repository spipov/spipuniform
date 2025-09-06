import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Folder, File, Upload, Trash2, Type, Image, FolderOpen, X 
} from 'lucide-react';
import type { FileItem } from '@/db/schema';

interface FileChooserProps {
  type: 'logo' | 'favicon' | 'font' | 'image' | 'document';
  onFileSelect: (file: FileItem) => void;
  onCancel: () => void;
  accept?: string;
  title?: string;
  description?: string;
}

export function FileChooser({ 
  type, 
  onFileSelect, 
  onCancel, 
  accept,
  title,
  description 
}: FileChooserProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Directory doesn't exist, try to fallback to root
          if (currentPath !== '/') {
            setCurrentPath('/');
            return;
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data?.files) {
        // Filter files based on type but always show folders for navigation
        let filteredFiles = result.data.files;
        
        if (type === 'font') {
          filteredFiles = filteredFiles.filter((file: FileItem) =>
            file.type === 'folder' || 
            (file.type === 'file' && (file.mimeType?.startsWith('font/') || /\.(woff2?|ttf|otf)$/i.test(file.name)))
          );
        } else if (type === 'logo' || type === 'favicon' || type === 'image') {
          filteredFiles = filteredFiles.filter((file: FileItem) =>
            file.type === 'folder' || 
            (file.type === 'file' && (file.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|svg|gif|webp)$/i.test(file.name)))
          );
        }
        
        setFiles(filteredFiles || []);
      } else {
        console.error('API Error:', result);
        setFiles([]);
        if (result.error) {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
      // Only show toast error if it's not a fallback attempt
      if (currentPath === '/') {
        toast.error('Failed to load file system. Please check your file system setup.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPath, type]);

  useEffect(() => {
    loadFiles();
  }, [currentPath, loadFiles]);

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path);
    } else {
      onFileSelect(file);
    }
  };

  const handleNavigateUp = () => {
    if (currentPath !== '/') {
      const pathParts = currentPath.split('/').filter(Boolean);
      pathParts.pop();
      setCurrentPath(pathParts.length === 0 ? '/' : `/${pathParts.join('/')}`);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    const folderData = {
      path: currentPath,
      name: newFolderName.trim(),
    };

    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderData),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Folder "${newFolderName}" created successfully`);
        setNewFolderName('');
        setCreatingFolder(false);
        await loadFiles();
      } else {
        toast.error(result.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleDeleteFile = async (file: FileItem, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(file.path)}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`"${file.name}" deleted successfully`);
        await loadFiles();
      } else {
        toast.error(result.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleFileUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.style.position = 'fixed';
    input.style.top = '0';
    input.style.left = '0';
    input.style.zIndex = '999999';

    // Set appropriate file filters based on type
    if (type === 'font') {
      input.accept = accept || '.woff,.woff2,.ttf,.otf';
    } else if (type === 'logo' || type === 'favicon' || type === 'image') {
      input.accept = accept || '.jpg,.jpeg,.png,.svg,.gif,.webp';
    } else if (accept) {
      input.accept = accept;
    }

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      
      if (file) {
        try {
          setUploading(true);
          const formData = new FormData();
          formData.append('files', file);
          formData.append('path', currentPath);

          // Determine category based on type
          let category = 'documents';
          if (type === 'font') {
            category = 'fonts';
          } else if (type === 'logo' || type === 'favicon' || type === 'image') {
            category = 'images';
          }
          formData.append('category', category);

          const response = await fetch('/api/files', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          if (result.success) {
            toast.success(`${file.name} uploaded successfully`);
            await loadFiles();
          } else {
            toast.error(result.error || 'Failed to upload file');
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          toast.error('Failed to upload file');
        } finally {
          setUploading(false);
        }
      }
      
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    input.oncancel = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    document.body.appendChild(input);
    setTimeout(() => {
      input.click();
    }, 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading files...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || description) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-medium">{title}</h3>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNavigateUp}
            disabled={currentPath === '/'}
          >
            ← Up
          </Button>
          <span className="text-sm font-medium">
            {currentPath === '/' ? 'Root' : currentPath}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreatingFolder(true)}
            className="flex items-center gap-2"
          >
            <Folder className="h-4 w-4" />
            Create Folder
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFileUpload}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload New
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Create Folder Input */}
      {creatingFolder && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded">
          <Input
            placeholder="Enter folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              } else if (e.key === 'Escape') {
                setCreatingFolder(false);
                setNewFolderName('');
              }
            }}
            className="flex-1"
            autoFocus
          />
          <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
            Create
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            setCreatingFolder(false);
            setNewFolderName('');
          }}>
            Cancel
          </Button>
        </div>
      )}

      {/* File List */}
      <div className="max-h-96 overflow-y-auto border rounded">
        {files.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="mb-4">
              {type === 'font' && <Type className="h-12 w-12 mx-auto mb-2 opacity-50" />}
              {(type === 'logo' || type === 'favicon' || type === 'image') && 
                <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />}
              {(type === 'document') && <File className="h-12 w-12 mx-auto mb-2 opacity-50" />}
            </div>
            <p className="mb-2">No {type} files found</p>
            <p className="text-sm">Click "Upload New" to add files</p>
          </div>
        ) : (
          <div className="divide-y">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 hover:bg-muted group relative"
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  {file.type === 'folder' ? (
                    <Folder className="h-5 w-5 text-blue-500" />
                  ) : (
                    <File className="h-5 w-5 text-gray-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {file.type === 'folder' ? 'Folder' : `${((file.size || 0) / 1024).toFixed(1)} KB`}
                    </p>
                  </div>
                  {file.type === 'file' && file.url && (type === 'logo' || type === 'favicon' || type === 'image') && (
                    <div className="w-8 h-8 rounded overflow-hidden bg-muted">
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Delete button - only show for files */}
                {file.type === 'file' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDeleteFile(file, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}