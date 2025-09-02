import React from 'react';
import { File, Folder, MoreHorizontal, Download, Edit, Trash2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useFileManager } from './file-manager-provider';
import { DragDropZone } from './drag-drop-upload';
import type { FileItem } from '@/db/schema';

interface FileItemProps {
  file: FileItem;
  isSelected: boolean;
  onSelect: (fileId: string) => void;
  onNavigate: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onMove?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  viewMode: 'grid' | 'list';
}

function FileItemComponent({
  file,
  isSelected,
  onSelect,
  onNavigate,
  onDownload,
  onRename,
  onMove,
  onDelete,
  viewMode,
}: FileItemProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      onSelect(file.id);
    } else {
      onNavigate(file);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    onSelect(file.id);
  };

  return (
    <div
      className={cn(
        "group relative border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer",
        viewMode === 'grid' ? "p-4 text-center bg-white" : "flex items-center p-3 bg-white hover:bg-gray-50",
        isSelected && "ring-2 ring-blue-500 bg-blue-50"
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate(file);
        }
      }}
    >
      {/* Selection Checkbox */}
      <div className={cn(
        "absolute top-2 left-2",
        viewMode === 'grid' ? "" : "static mr-3"
      )}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity"
        />
      </div>

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
        <div
          className="font-medium text-gray-900 truncate"
          title={file.name}
        >
          {file.name}
        </div>
        {viewMode === 'list' && (
          <div className="flex items-center justify-between mt-1 text-sm text-gray-500">
            <span>
              {file.type === 'file' ? formatFileSize(file.size || 0) : 'Folder'}
            </span>
            <span>
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
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {file.type === 'file' && onDownload && (
              <DropdownMenuItem onClick={() => onDownload(file)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            {onRename && (
              <DropdownMenuItem onClick={() => onRename(file)}>
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
            )}
            {onMove && (
              <DropdownMenuItem onClick={() => onMove(file)}>
                <Move className="h-4 w-4 mr-2" />
                Move
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(file)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface FileGridViewProps {
  files: FileItem[];
  selectedFiles: string[];
  onSelect: (fileId: string) => void;
  onNavigate: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onMove?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
}

function FileGridView({
  files,
  selectedFiles,
  onSelect,
  onNavigate,
  onDownload,
  onRename,
  onMove,
  onDelete,
}: FileGridViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
      {files.map((file) => (
        <FileItemComponent
          key={file.id}
          file={file}
          isSelected={selectedFiles.includes(file.id)}
          onSelect={onSelect}
          onNavigate={onNavigate}
          onDownload={onDownload}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          viewMode="grid"
        />
      ))}
    </div>
  );
}

interface FileListViewProps {
  files: FileItem[];
  selectedFiles: string[];
  onSelect: (fileId: string) => void;
  onNavigate: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onMove?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
}

function FileListView({
  files,
  selectedFiles,
  onSelect,
  onNavigate,
  onDownload,
  onRename,
  onMove,
  onDelete,
}: FileListViewProps) {
  return (
    <div className="space-y-1">
      {files.map((file) => (
        <FileItemComponent
          key={file.id}
          file={file}
          isSelected={selectedFiles.includes(file.id)}
          onSelect={onSelect}
          onNavigate={onNavigate}
          onDownload={onDownload}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          viewMode="list"
        />
      ))}
    </div>
  );
}

interface FileViewContainerProps {
  className?: string;
  onNavigate?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onMove?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  onFilesDrop?: (files: FileList) => void;
}

export function FileViewContainer({
  className,
  onNavigate,
  onDownload,
  onRename,
  onMove,
  onDelete,
  onFilesDrop,
}: FileViewContainerProps) {
  const { state, toggleFileSelection } = useFileManager();

  const handleNavigate = (file: FileItem) => {
    if (onNavigate) {
      onNavigate(file);
    }
  };

  const handleSelect = (fileId: string) => {
    toggleFileSelection(fileId);
  };

  const handleFilesDrop = (files: FileList) => {
    if (onFilesDrop) {
      onFilesDrop(files);
    }
  };

  if (state.isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading files...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-red-600">Error: {state.error}</div>
      </div>
    );
  }

  if (state.files.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-gray-500">No files found</div>
      </div>
    );
  }

  const content = (
    <div className={cn("flex-1 p-4 overflow-auto", className)}>
      {state.viewMode === 'grid' ? (
        <FileGridView
          files={state.files}
          selectedFiles={state.selectedFiles}
          onSelect={handleSelect}
          onNavigate={handleNavigate}
          onDownload={onDownload}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
        />
      ) : (
        <FileListView
          files={state.files}
          selectedFiles={state.selectedFiles}
          onSelect={handleSelect}
          onNavigate={handleNavigate}
          onDownload={onDownload}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
        />
      )}
    </div>
  );

  if (onFilesDrop) {
    return (
      <DragDropZone onFilesDrop={handleFilesDrop} className="flex-1">
        {content}
      </DragDropZone>
    );
  }

  return content;
}

export default FileViewContainer;