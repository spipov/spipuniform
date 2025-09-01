import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Image, 
  File, 
  X, 
  Check,
  AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadWidgetProps {
  onFileUploaded: (url: string, filename: string) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  uploadPath?: string;
  className?: string;
  label?: string;
  description?: string;
  preview?: boolean;
  currentFileUrl?: string;
  currentFileName?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export function FileUploadWidget({
  onFileUploaded,
  acceptedFileTypes = "image/*",
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  uploadPath = "/branding",
  className,
  label = "Upload File",
  description,
  preview = false,
  currentFileUrl,
  currentFileName,
}: FileUploadWidgetProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
  });
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadState(prev => ({ ...prev, isUploading: true, error: null, progress: 0 }));

      const formData = new FormData();
      formData.append('files', file);
      formData.append('path', uploadPath);

      // Create XMLHttpRequest to track progress
      return new Promise<{ url: string; filename: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadState(prev => ({ ...prev, progress: percentComplete }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.data.uploadedFiles?.length > 0) {
                const uploadedFile = response.data.uploadedFiles[0];
                resolve({ 
                  url: uploadedFile.url, 
                  filename: uploadedFile.name 
                });
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/files');
        xhr.send(formData);
      });
    },
    onSuccess: ({ url, filename }) => {
      setUploadState({ isUploading: false, progress: 100, error: null, success: true });
      onFileUploaded(url, filename);
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: false }));
      }, 3000);
    },
    onError: (error: Error) => {
      setUploadState({ 
        isUploading: false, 
        progress: 0, 
        error: error.message, 
        success: false 
      });
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file size
    if (file.size > maxFileSize) {
      setUploadState(prev => ({ 
        ...prev, 
        error: `File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit` 
      }));
      return;
    }

    // Validate file type
    if (acceptedFileTypes !== "*" && !acceptedFileTypes.split(',').some(type => {
      const trimmedType = type.trim();
      if (trimmedType.endsWith('/*')) {
        return file.type.startsWith(trimmedType.slice(0, -2));
      }
      return file.type === trimmedType || file.name.toLowerCase().endsWith(trimmedType);
    })) {
      setUploadState(prev => ({ 
        ...prev, 
        error: `File type not allowed. Accepted types: ${acceptedFileTypes}` 
      }));
      return;
    }

    setSelectedFile(file);
    setUploadState(prev => ({ ...prev, error: null }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadState({ isUploading: false, progress: 0, error: null, success: false });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <div className="space-y-1">
          <Label>{label}</Label>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}

      {/* Current File Preview */}
      {currentFileUrl && !selectedFile && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {preview && currentFileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={currentFileUrl}
                    alt="Current file"
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                    <File className="h-6 w-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{currentFileName || 'Current file'}</p>
                  <p className="text-xs text-gray-500">Currently active</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg transition-colors",
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
          uploadState.isUploading && "pointer-events-none opacity-50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-6 text-center space-y-4">
          {/* Selected File or Drop Area */}
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                {preview && selectedFile.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                    <File className="h-8 w-8 text-gray-500" />
                  </div>
                )}
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                {!uploadState.isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Upload Progress */}
              {uploadState.isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadState.progress} />
                  <p className="text-sm text-gray-600">
                    Uploading... {Math.round(uploadState.progress)}%
                  </p>
                </div>
              )}

              {/* Upload Button */}
              {!uploadState.isUploading && !uploadState.success && (
                <Button onClick={handleUpload} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              )}

              {/* Success State */}
              {uploadState.success && (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Upload successful!</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: {Math.round(maxFileSize / (1024 * 1024))}MB
                </p>
                {acceptedFileTypes !== "*" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Accepted types: {acceptedFileTypes}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {uploadState.error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{uploadState.error}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}