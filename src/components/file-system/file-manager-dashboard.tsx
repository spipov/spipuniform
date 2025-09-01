import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Folder, 
  File, 
  Upload, 
  FolderPlus, 
  MoreHorizontal, 
  Search,
  Grid3X3,
  List,
  Download,
  Trash2,
  Edit,
  Move
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { FileListResponse, FileItem } from "@/db/schema";

interface FileManagerDashboardProps {
  className?: string;
}

export function FileManagerDashboard({ className }: FileManagerDashboardProps) {
  const [currentPath, setCurrentPath] = useState("/");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch files for current path
  const { data: filesData, isLoading } = useQuery<FileListResponse>({
    queryKey: ['files', currentPath, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        path: currentPath,
        ...(searchQuery && { search: searchQuery }),
      });
      
      const response = await fetch(`/api/files?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('path', currentPath);
      
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
    },
  });

  // File deletion mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files?id=${fileId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
      setFileToDelete(null);
    },
  });

  // Folder creation mutation
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          path: currentPath,
          type: 'folder',
        }),
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const handleCreateFolder = () => {
    const name = prompt("Enter folder name:");
    if (name && name.trim()) {
      createFolderMutation.mutate(name.trim());
    }
  };

  const handleNavigate = (file: FileItem) => {
    if (file.type === 'folder') {
      const newPath = file.path === '/' ? `/${file.name}` : `${file.path}/${file.name}`;
      setCurrentPath(newPath);
    } else {
      // Handle file download or preview
      if (file.url) {
        window.open(file.url, '_blank');
      }
    }
  };

  const handleDelete = (file: FileItem) => {
    setFileToDelete(file);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteMutation.mutate(fileToDelete.id);
    }
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={cn("flex flex-col h-full bg-white rounded-lg border", className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => setCurrentPath('/')}
            className="hover:text-gray-900"
          >
            Root
          </button>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span>/</span>
              <button
                onClick={() => {
                  const path = '/' + breadcrumbs.slice(0, index + 1).join('/');
                  setCurrentPath(path);
                }}
                className="hover:text-gray-900"
              >
                {crumb}
              </button>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload Button */}
            <label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </span>
              </Button>
            </label>

            {/* Create Folder */}
            <Button variant="outline" onClick={handleCreateFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !filesData?.files?.length ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No files found
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 
            "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" : 
            "space-y-2"
          }>
            {filesData.files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "group relative border rounded-lg hover:shadow-md transition-shadow",
                  viewMode === 'grid' ? "p-4 text-center" : "flex items-center p-3 hover:bg-gray-50"
                )}
              >
                {/* File Icon */}
                <div className={cn(
                  "flex items-center justify-center",
                  viewMode === 'grid' ? "mx-auto mb-2" : "mr-3"
                )}>
                  {file.type === 'folder' ? (
                    <Folder className="h-8 w-8 text-blue-500" />
                  ) : (
                    <File className="h-8 w-8 text-gray-500" />
                  )}
                </div>

                {/* File Info */}
                <div className={cn(
                  viewMode === 'grid' ? "text-center" : "flex-1 min-w-0"
                )}>
                  <button
                    onClick={() => handleNavigate(file)}
                    className="font-medium text-gray-900 hover:text-blue-600 truncate block w-full text-left"
                  >
                    {file.name}
                  </button>
                  {viewMode === 'list' && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-500">
                        {file.type === 'file' ? formatFileSize(file.size || 0) : 'Folder'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions Menu */}
                <div className={cn(
                  "absolute",
                  viewMode === 'grid' ? "top-2 right-2" : "right-2"
                )}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {file.type === 'file' && (
                        <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Move className="h-4 w-4 mr-2" />
                        Move
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(file)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}