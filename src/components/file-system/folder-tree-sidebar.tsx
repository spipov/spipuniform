import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useFileManager } from './file-manager-provider';
import type { FileItem, FileListResponse } from '@/db/schema';

interface TreeNodeProps {
  file: FileItem;
  level: number;
  onNavigate: (path: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onDelete: (fileId: string) => void;
  onRename: (file: FileItem) => void;
}

function TreeNode({ file, level, onNavigate, onCreateFolder, onDelete, onRename }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { state } = useFileManager();
  const isSelected = state.currentPath === (file.path === '/uploads' ? `/uploads/${file.name}` : `${file.path}/${file.name}`);

  const childPath = file.path === '/uploads' ? `/uploads/${file.name}` : `${file.path}/${file.name}`;

  // Fetch children when expanded
  const { data: childrenData, isLoading } = useQuery<FileListResponse>({
    queryKey: ['folders', childPath],
    queryFn: async () => {
      const response = await fetch(`/api/files?path=${encodeURIComponent(childPath)}&type=folder`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: isExpanded, // Only fetch when expanded
  });

  const children = childrenData?.files || [];

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavigate = () => {
    const newPath = file.path === '/uploads' ? `/uploads/${file.name}` : `${file.path}/${file.name}`;
    onNavigate(newPath);
  };

  const handleCreateFolder = () => {
    const parentPath = file.path === '/uploads' ? `/uploads/${file.name}` : `${file.path}/${file.name}`;
    onCreateFolder(parentPath);
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer group",
          isSelected && "bg-blue-50 text-blue-700"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 mr-1"
          onClick={handleToggle}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin h-3 w-3 border border-gray-300 border-t-gray-600 rounded-full" />
          ) : isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>

        {/* Folder Icon */}
        <div className="mr-2">
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          )}
        </div>

        {/* Folder Name */}
        <span
          className="flex-1 text-sm truncate"
          onClick={handleNavigate}
          title={file.name}
        >
          {file.name}
        </span>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCreateFolder}>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRename(file)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(file.id)}
              className="text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              file={child}
              level={level + 1}
              onNavigate={onNavigate}
              onCreateFolder={onCreateFolder}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderTreeSidebarProps {
  className?: string;
  onCreateFolder?: (parentPath: string) => void;
  onDelete?: (fileId: string) => void;
  onRename?: (file: FileItem) => void;
}

export function FolderTreeSidebar({
  className,
  onCreateFolder,
  onDelete,
  onRename
}: FolderTreeSidebarProps) {
  const { state, navigateToPath } = useFileManager();

  // Fetch root folders
  const { data: rootFoldersData, isLoading } = useQuery<FileListResponse>({
    queryKey: ['folders', '/uploads'],
    queryFn: async () => {
      const response = await fetch('/api/files?path=/uploads&type=folder');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  });

  const rootFolders = rootFoldersData?.files || [];

  const handleNavigate = (path: string) => {
    navigateToPath(path);
  };

  const handleCreateFolder = (parentPath: string) => {
    if (onCreateFolder) {
      onCreateFolder(parentPath);
    }
  };

  const handleDelete = (fileId: string) => {
    if (onDelete) {
      onDelete(fileId);
    }
  };

  const handleRename = (file: FileItem) => {
    if (onRename) {
      onRename(file);
    }
  };

  return (
    <div className={cn("w-70 bg-white border-r border-gray-200 flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div>
            {/* Root */}
            <div
              className={cn(
                "flex items-center py-2 px-4 hover:bg-gray-100 cursor-pointer",
                state.currentPath === '/uploads' && "bg-blue-50 text-blue-700"
              )}
              onClick={() => handleNavigate('/uploads')}
            >
              <Folder className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium">Uploads</span>
            </div>

            {/* Root Folders */}
            {rootFolders.map((folder) => (
              <TreeNode
                key={folder.id}
                file={folder}
                level={0}
                onNavigate={handleNavigate}
                onCreateFolder={handleCreateFolder}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FolderTreeSidebar;