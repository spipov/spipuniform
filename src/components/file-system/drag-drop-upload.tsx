import type React from 'react';
import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DragDropUploadProps {
  onFilesDrop: (files: FileList) => void;
  className?: string;
  disabled?: boolean;
}

export function DragDropUpload({ onFilesDrop, className, disabled }: DragDropUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0 && !disabled) {
      onFilesDrop(files);
    }
  }, [onFilesDrop, disabled]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && !disabled) {
      onFilesDrop(files);
    }
    // Reset input
    e.target.value = '';
  }, [onFilesDrop, disabled]);

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-all duration-200",
        isDragOver
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Upload className={cn(
          "h-12 w-12 mb-4",
          isDragOver ? "text-blue-500" : "text-gray-400"
        )} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragOver ? "Drop files here" : "Drag & drop files here"}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse files
        </p>
        <label>
          <input
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
            aria-label="Upload files"
          />
          <Button
            type="button"
            disabled={disabled}
            className="cursor-pointer"
          >
            Browse Files
          </Button>
        </label>
      </div>

      {/* Overlay for drag feedback */}
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Drop files to upload</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface DragDropZoneProps {
  onFilesDrop: (files: FileList) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function DragDropZone({ onFilesDrop, children, className, disabled }: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0 && !disabled) {
      onFilesDrop(files);
    }
  }, [onFilesDrop, disabled]);

  return (
    <div
      className={cn(
        "relative transition-all duration-200",
        isDragOver && "bg-blue-50 border-blue-200",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-5 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 shadow-lg border">
            <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Drop files here to upload</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DragDropUpload;