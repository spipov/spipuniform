import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Eye, Settings, Plus, Edit, Trash2, Check, Save, X, FolderOpen, Type, Upload, Image, File, Folder, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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

interface BrandingConfig {
  id: string;
  siteName: string;
  siteDescription?: string;
  siteUrl?: string;
  logoUrl?: string;
  logoAlt?: string;
  faviconUrl?: string;
  logoDisplayMode?: 'logo-only' | 'logo-with-name' | 'name-only';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headingFont?: string;
  fontSize?: string;
  lineHeight?: string;
  borderRadius?: string;
  spacing?: string;
  supportEmail?: string;
  contactPhone?: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    github?: string;
  };
  customCss?: string;
  customFonts?: Record<string, {
    url: string;
    format: string;
    weight?: string;
    style?: string;
  }>;
  isActive: boolean;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'custom', label: 'Custom Font (Upload)' }
];

// File Picker Component with Upload Support
interface FilePickerProps {
  type: 'logo' | 'favicon' | 'font';
  onFileSelect: (file: FileItem) => void;
  onCancel: () => void;
}

function FilePicker({ type, onFileSelect, onCancel }: FilePickerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPath, setCurrentPath] = useState('/uploads');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
      const result = await response.json();

      if (result.success) {
        // Filter files based on type but always show folders for navigation
        let filteredFiles = result.data.files;
        if (type === 'font') {
          filteredFiles = filteredFiles.filter((file: FileItem) =>
            file.type === 'folder' || 
            (file.type === 'file' && (file.mimeType?.startsWith('font/') || /\.(woff2?|ttf|otf)$/i.test(file.name)))
          );
        } else if (type === 'logo' || type === 'favicon') {
          filteredFiles = filteredFiles.filter((file: FileItem) =>
            file.type === 'folder' || 
            (file.type === 'file' && (file.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|svg|gif|webp)$/i.test(file.name)))
          );
        }

        setFiles(filteredFiles);
      } else {
        toast.error(result.error || 'Failed to load files');
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [currentPath, type]);

  useEffect(() => {
    loadFiles();
  }, [currentPath, loadFiles]);

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      // The file.path already includes the full path to the folder
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
    // console.log('Create folder clicked, folder name:', newFolderName);
    
    if (!newFolderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    const folderData = {
      path: currentPath,
      name: newFolderName.trim(),
    };
    
    // console.log('Making PUT request to create folder:', folderData);

    try {
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderData),
      });

      // console.log('Create folder response status:', response.status);
      
      const result = await response.json();
      // console.log('Create folder result:', result);

      if (result.success) {
        toast.success(`Folder "${newFolderName}" created successfully`);
        setNewFolderName('');
        setCreatingFolder(false);
        // console.log('Reloading files after folder creation');
        await loadFiles(); // Reload the file list
      } else {
        toast.error(result.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleDeleteFile = async (file: FileItem, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the file click
    
    // console.log('Delete button clicked for file:', file);
    
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      // console.log('User cancelled delete');
      return;
    }
    
    const deleteUrl = `/api/files?path=${encodeURIComponent(file.path)}`;
    // console.log('Making DELETE request to:', deleteUrl);
    
    try {
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });
      
      // console.log('Delete response status:', response.status);
      // console.log('Delete response:', response);
      
      const result = await response.json();
      // console.log('Delete result:', result);
      
      if (result.success) {
        toast.success(`"${file.name}" deleted successfully`);
        // console.log('Reloading files after delete');
        await loadFiles(); // Reload the file list
      } else {
        toast.error(result.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleFileUpload = async () => {
    // console.log('Upload button clicked');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.style.position = 'fixed';
    input.style.top = '0';
    input.style.left = '0';
    input.style.zIndex = '999999';

    // Set appropriate file filters based on type
    if (type === 'font') {
      input.accept = '.woff,.woff2,.ttf,.otf';
    } else if (type === 'logo' || type === 'favicon') {
      input.accept = '.jpg,.jpeg,.png,.svg,.gif,.webp';
    }

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      // console.log('File selected for upload:', file);
      
      if (file) {
        try {
          setUploading(true);
          const formData = new FormData();
          formData.append('files', file); // Note: changed from 'file' to 'files'
          formData.append('path', currentPath);

          // Determine category based on type
          let category = 'documents';
          if (type === 'font') {
            category = 'fonts';
          } else if (type === 'logo' || type === 'favicon') {
            category = 'images';
          }
          formData.append('category', category);

          // console.log('Uploading file with category:', category, 'to path:', currentPath);
          
          const response = await fetch('/api/files', {
            method: 'POST',
            body: formData,
          });

          // console.log('Upload response status:', response.status);
          
          const result = await response.json();
          // console.log('Upload result:', result);

          if (result.success) {
            toast.success(`${file.name} uploaded successfully`);
            // console.log('Reloading files after upload');
            await loadFiles(); // Reload the file list
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
    // Add a small delay to ensure the input is properly rendered before clicking
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
      {/* Header with Upload and Create Folder Buttons */}
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
          <span className="text-sm font-medium">{currentPath === '/' ? 'Root' : currentPath}</span>
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
        <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded">
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
              {(type === 'logo' || type === 'favicon') && <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />}
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
                  {file.type === 'file' && file.url && (type === 'logo' || type === 'favicon') && (
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


const fontSizeOptions = [
  { value: '14px', label: 'Small (14px)' },
  { value: '16px', label: 'Medium (16px)' },
  { value: '18px', label: 'Large (18px)' },
  { value: '20px', label: 'Extra Large (20px)' }
];

const lineHeightOptions = [
  { value: '1.4', label: 'Tight (1.4)' },
  { value: '1.5', label: 'Normal (1.5)' },
  { value: '1.6', label: 'Relaxed (1.6)' },
  { value: '1.8', label: 'Loose (1.8)' }
];


export function BrandingManagement() {
  const [brandingConfigs, setBrandingConfigs] = useState<BrandingConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<BrandingConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<BrandingConfig>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // File Picker Inline State
  const [filePickerType, setFilePickerType] = useState<'logo' | 'favicon' | 'font' | null>(null);
  const [preselectedFiles, setPreselectedFiles] = useState<{
    logo?: FileItem;
    favicon?: FileItem;
    font?: FileItem;
  }>({});
  
  // Debug the state changes
  useEffect(() => {
    // console.log('filePickerType state changed:', filePickerType);
    // console.log('filePickerType state changed:', filePickerType);
    }, [filePickerType]);

  // Fetch branding configurations from API
  useEffect(() => {
    fetchBrandingConfigs();
  }, []);

  const fetchBrandingConfigs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/branding');
      const result = await response.json();
      
      if (result.success) {
        setBrandingConfigs(result.data);
      } else {
        toast.error('Failed to fetch branding configurations');
      }
    } catch (error) {
      console.error('Error fetching branding configs:', error);
      toast.error('Failed to fetch branding configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.siteName?.trim()) {
      toast.error('App name is required');
      return;
    }

    try {
      setIsSaving(true);
      const isUpdate = !!selectedConfig?.id;
      const url = '/api/branding';
      const method = isUpdate ? 'PUT' : 'POST';
      const payload = isUpdate ? { id: selectedConfig.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isUpdate ? 'Branding updated successfully' : 'Branding created successfully');
        await fetchBrandingConfigs();
        setIsEditing(false);
        setSelectedConfig(null);
        setFormData({});
        setLogoPreview(null);
      } else {
        toast.error(result.error || 'Failed to save branding configuration');
      }
    } catch (error) {
      console.error('Error saving branding config:', error);
      toast.error('Failed to save branding configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const response = await fetch('/api/branding/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Branding configuration activated');
        await fetchBrandingConfigs();
      } else {
        toast.error(result.error || 'Failed to activate branding configuration');
      }
    } catch (error) {
      console.error('Error activating branding config:', error);
      toast.error('Failed to activate branding configuration');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branding configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/branding?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Branding configuration deleted');
        await fetchBrandingConfigs();
      } else {
        toast.error(result.error || 'Failed to delete branding configuration');
      }
    } catch (error) {
      console.error('Error deleting branding config:', error);
      toast.error('Failed to delete branding configuration');
    }
  };

  const handleEdit = (config: BrandingConfig) => {
    setSelectedConfig(config);
    setFormData(config);
    setLogoPreview(config.logoUrl || null);
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setSelectedConfig(null);
    setFormData({
      siteName: '',
      siteDescription: '',
      siteUrl: '',
      logoUrl: preselectedFiles.logo?.url || '',
      logoAlt: '',
      faviconUrl: preselectedFiles.favicon?.url || '',
      logoDisplayMode: 'logo-with-name',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: preselectedFiles.font ? preselectedFiles.font.name.replace(/\.(woff2?|ttf|otf)$/i, '') : 'Inter',
      headingFont: preselectedFiles.font ? preselectedFiles.font.name.replace(/\.(woff2?|ttf|otf)$/i, '') : 'Inter',
      borderRadius: '0.5rem',
      spacing: '1rem',
      supportEmail: '',
      contactPhone: '',
      socialLinks: {},
      customCss: '',
      customFonts: preselectedFiles.font && preselectedFiles.font.url ? {
        [preselectedFiles.font.name.replace(/\.(woff2?|ttf|otf)$/i, '')]: {
          url: preselectedFiles.font.url,
          format: preselectedFiles.font.name.split('.').pop() || 'woff2',
          weight: 'normal',
          style: 'normal',
        }
      } : undefined,
      version: '1.0.0',
      isActive: false
    });
    setLogoPreview(preselectedFiles.logo?.url || null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedConfig(null);
    setFormData({});
    setLogoPreview(null);
  };

  const handleInputChange = (field: keyof BrandingConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenFilePicker = (type: 'logo' | 'favicon' | 'font') => {
    setFilePickerType(type);
  };

  const handleFilePickerSelect = async (file: FileItem) => {
    if (!filePickerType || !file.url) return;

    const type = filePickerType;

    // Store in preselected files
    setPreselectedFiles(prev => ({
      ...prev,
      [type]: file
    }));

    if (type === 'logo') {
      setLogoPreview(file.url);
      setFormData(prev => ({ ...prev, logoUrl: file.url }));
      toast.success('Logo selected successfully');
    } else if (type === 'favicon') {
      setFormData(prev => ({ ...prev, faviconUrl: file.url }));
      toast.success('Favicon selected successfully');
    } else if (type === 'font') {
      // For fonts, we would need to add custom font handling
      toast.success(`Font "${file.name}" selected successfully`);
    }

    setFilePickerType(null);
  };

  const handleFilePickerCancel = () => {
    setFilePickerType(null);
  };




  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading branding configurations...</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <>
        <Dialog open={isEditing} onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedConfig ? 'Edit Branding Configuration' : 'Create New Branding Configuration'}
              </DialogTitle>
              <DialogDescription>
                Configure your app's branding and visual identity
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Configure your app's basic branding details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="siteName">App Name *</Label>
                      <Input
                        id="siteName"
                        value={formData.siteName || ''}
                        onChange={(e) => handleInputChange('siteName', e.target.value)}
                        placeholder="Enter your app name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="siteDescription">App Description</Label>
                      <Textarea
                        id="siteDescription"
                        value={formData.siteDescription || ''}
                        onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                        placeholder="Brief description of your app"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="siteUrl">App URL</Label>
                      <Input
                        id="siteUrl"
                        value={formData.siteUrl || ''}
                        onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                        placeholder="https://yourapp.com"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Logo & Visual Assets */}
                <Card>
                  <CardHeader>
                    <CardTitle>Logo & Visual Assets</CardTitle>
                    <CardDescription>Upload and configure your app's visual identity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="logo">Logo</Label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenFilePicker('logo')}
                              className="flex items-center gap-2"
                            >
                              <FolderOpen className="h-4 w-4" />
                              Choose from File System
                            </Button>
                            <span className="text-xs text-muted-foreground">Opens file browser below</span>
                          </div>
                          <span className="text-sm text-muted-foreground">or</span>
                          <div className="flex-1">
                            <Input
                              id="logo"
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="cursor-pointer"
                            />
                          </div>
                        </div>
                        {logoPreview && (
                          <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-gray-50 relative group">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="max-w-full max-h-full object-contain"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setLogoPreview(null);
                                setFormData(prev => ({ ...prev, logoUrl: '' }));
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="logoAlt">Logo Alt Text</Label>
                      <Input
                        id="logoAlt"
                        value={formData.logoAlt || ''}
                        onChange={(e) => handleInputChange('logoAlt', e.target.value)}
                        placeholder="Descriptive text for your logo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="logoDisplayMode">Logo Display Mode</Label>
                      <Select
                        value={formData.logoDisplayMode || 'logo-with-name'}
                        onValueChange={(value) => handleInputChange('logoDisplayMode', value as 'logo-only' | 'logo-with-name' | 'name-only')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select logo display mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="logo-only">Logo Only</SelectItem>
                          <SelectItem value="logo-with-name">Logo + Name</SelectItem>
                          <SelectItem value="name-only">Name Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        How the logo and app name appear in the header and throughout the app
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="favicon">Favicon</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenFilePicker('favicon')}
                              className="flex items-center gap-2"
                            >
                              <FolderOpen className="h-4 w-4" />
                              Choose from File System
                            </Button>
                            <span className="text-xs text-muted-foreground">Opens file browser below</span>
                          </div>
                          <span className="text-sm text-muted-foreground">or</span>
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              id="faviconUrl"
                              value={formData.faviconUrl || ''}
                              onChange={(e) => handleInputChange('faviconUrl', e.target.value)}
                              placeholder="URL to your favicon"
                            />
                            {formData.faviconUrl && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleInputChange('faviconUrl', '')}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Color Scheme */}
                <Card>
                  <CardHeader>
                    <CardTitle>Color Scheme</CardTitle>
                    <CardDescription>Define your app's color palette</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={formData.primaryColor || '#3b82f6'}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            value={formData.primaryColor || '#3b82f6'}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={formData.secondaryColor || '#64748b'}
                            onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            value={formData.secondaryColor || '#64748b'}
                            onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                            placeholder="#64748b"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="accentColor">Accent Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accentColor"
                            type="color"
                            value={formData.accentColor || '#f59e0b'}
                            onChange={(e) => handleInputChange('accentColor', e.target.value)}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            value={formData.accentColor || '#f59e0b'}
                            onChange={(e) => handleInputChange('accentColor', e.target.value)}
                            placeholder="#f59e0b"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="backgroundColor">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="backgroundColor"
                            type="color"
                            value={formData.backgroundColor || '#ffffff'}
                            onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            value={formData.backgroundColor || '#ffffff'}
                            onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Typography */}
                <Card>
                  <CardHeader>
                    <CardTitle>Typography</CardTitle>
                    <CardDescription>Configure your app's typography settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="fontFamily">Body Font</Label>
                      <div className="space-y-2">
                        <Select
                          value={formData.fontFamily || 'Inter'}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              handleOpenFilePicker('font');
                            } else {
                              handleInputChange('fontFamily', value);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select font family" />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                            {/* Add current custom font if it's not in the standard list */}
                            {formData.fontFamily && 
                             !fontOptions.some(font => font.value === formData.fontFamily) && 
                             formData.fontFamily !== 'custom' && (
                              <SelectItem key={formData.fontFamily} value={formData.fontFamily}>
                                {formData.fontFamily} (Current Custom)
                              </SelectItem>
                            )}
                            {/* Add custom fonts from customFonts object */}
                            {formData.customFonts && Object.keys(formData.customFonts).map((fontName) => (
                              <SelectItem key={fontName} value={fontName}>
                                {fontName} (Custom)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.customFonts && formData.fontFamily && formData.fontFamily in formData.customFonts && (
                          <div className="text-sm text-muted-foreground">
                            Custom font selected: {formData.fontFamily}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="headingFont">Heading Font</Label>
                      <Select
                        value={formData.headingFont || 'Inter'}
                        onValueChange={(value) => handleInputChange('headingFont', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select heading font" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Font Upload */}
                    <div>
                      <Label>Custom Font Upload</Label>
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenFilePicker('font')}
                          className="flex items-center gap-2 w-full"
                        >
                          <Type className="h-4 w-4" />
                          Upload Custom Font (WOFF/WOFF2)
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Upload .woff or .woff2 font files to use custom fonts across your app
                          <br />
                          📁 <strong>Opens file browser below</strong> - scroll down to browse and upload files
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fontSize">Base Font Size</Label>
                        <Select
                          value={formData.fontSize || '16px'}
                          onValueChange={(value) => handleInputChange('fontSize', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select font size" />
                          </SelectTrigger>
                          <SelectContent>
                            {fontSizeOptions.map((size) => (
                              <SelectItem key={size.value} value={size.value}>
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="lineHeight">Line Height</Label>
                        <Select
                          value={formData.lineHeight || '1.5'}
                          onValueChange={(value) => handleInputChange('lineHeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select line height" />
                          </SelectTrigger>
                          <SelectContent>
                            {lineHeightOptions.map((height) => (
                              <SelectItem key={height.value} value={height.value}>
                                {height.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact & Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact & Settings</CardTitle>
                    <CardDescription>Additional configuration and contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="supportEmail">Support Email</Label>
                        <Input
                          id="supportEmail"
                          type="email"
                          value={formData.supportEmail || ''}
                          onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                          placeholder="support@yourapp.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          value={formData.contactPhone || ''}
                          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="borderRadius">Border Radius</Label>
                        <Input
                          id="borderRadius"
                          value={formData.borderRadius || '0.5rem'}
                          onChange={(e) => handleInputChange('borderRadius', e.target.value)}
                          placeholder="0.5rem"
                        />
                      </div>
                      <div>
                        <Label htmlFor="spacing">Spacing</Label>
                        <Input
                          id="spacing"
                          value={formData.spacing || '1rem'}
                          onChange={(e) => handleInputChange('spacing', e.target.value)}
                          placeholder="1rem"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        value={formData.version || '1.0.0'}
                        onChange={(e) => handleInputChange('version', e.target.value)}
                        placeholder="1.0.0"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Social Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                    <CardDescription>Configure your social media presence</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="twitter">Twitter/X URL</Label>
                        <Input
                          id="twitter"
                          value={formData.socialLinks?.twitter || ''}
                          onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, twitter: e.target.value })}
                          placeholder="https://twitter.com/yourapp"
                        />
                      </div>
                      <div>
                        <Label htmlFor="facebook">Facebook URL</Label>
                        <Input
                          id="facebook"
                          value={formData.socialLinks?.facebook || ''}
                          onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, facebook: e.target.value })}
                          placeholder="https://facebook.com/yourapp"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                        <Input
                          id="linkedin"
                          value={formData.socialLinks?.linkedin || ''}
                          onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/company/yourapp"
                        />
                      </div>
                      <div>
                        <Label htmlFor="instagram">Instagram URL</Label>
                        <Input
                          id="instagram"
                          value={formData.socialLinks?.instagram || ''}
                          onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, instagram: e.target.value })}
                          placeholder="https://instagram.com/yourapp"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="github">GitHub URL</Label>
                      <Input
                        id="github"
                        value={formData.socialLinks?.github || ''}
                        onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, github: e.target.value })}
                        placeholder="https://github.com/yourapp"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Custom CSS */}
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Customization</CardTitle>
                    <CardDescription>Custom CSS and advanced styling options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="customCss">Custom CSS</Label>
                      <Textarea
                        id="customCss"
                        value={formData.customCss || ''}
                        onChange={(e) => handleInputChange('customCss', e.target.value)}
                        placeholder="/* Add your custom CSS here */&#10;.custom-class {&#10;  /* Your styles */&#10;}"
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Custom CSS will be injected into the application
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* File Picker Inline */}
              {filePickerType && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">
                        Select {filePickerType === 'logo' ? 'Logo Image' :
                               filePickerType === 'favicon' ? 'Favicon' :
                               filePickerType === 'font' ? 'Font File' : 'File'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        📁 Scroll down to browse files and folders in the file explorer below
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleFilePickerCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <FilePicker
                    type={filePickerType}
                    onFileSelect={handleFilePickerSelect}
                    onCancel={handleFilePickerCancel}
                  />
                </div>
              )}

              {/* Always show save buttons */}
              <div className="flex justify-end gap-2 pt-6 border-t mt-6">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Branding Management</h2>
          <p className="text-muted-foreground">Manage your app's branding and visual identity</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </div>

      {/* File Assets Section */}
      <Card>
        <CardHeader>
          <CardTitle>File Assets</CardTitle>
          <CardDescription>
            Pre-select logo, favicon, and font files from your file system before creating a configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Logo Selection */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenFilePicker('logo')}
                    className="flex items-center gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Choose Logo
                  </Button>
                  <span className="text-xs text-muted-foreground text-center">File browser opens below</span>
                </div>
                {preselectedFiles.logo && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 border rounded overflow-hidden bg-muted">
                      <img
                        src={preselectedFiles.logo.url}
                        alt={preselectedFiles.logo.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground truncate max-w-24">
                      {preselectedFiles.logo.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreselectedFiles(prev => ({ ...prev, logo: undefined }))}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Favicon Selection */}
            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenFilePicker('favicon')}
                    className="flex items-center gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Choose Favicon
                  </Button>
                  <span className="text-xs text-muted-foreground text-center">File browser opens below</span>
                </div>
                {preselectedFiles.favicon && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 border rounded overflow-hidden bg-muted">
                      <img
                        src={preselectedFiles.favicon.url}
                        alt={preselectedFiles.favicon.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground truncate max-w-24">
                      {preselectedFiles.favicon.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreselectedFiles(prev => ({ ...prev, favicon: undefined }))}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Font Selection */}
            <div className="space-y-2">
              <Label>Custom Font</Label>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenFilePicker('font')}
                    className="flex items-center gap-2"
                  >
                    <Type className="h-4 w-4" />
                    Choose Font
                  </Button>
                  <span className="text-xs text-muted-foreground text-center">File browser opens below</span>
                </div>
                {preselectedFiles.font && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate max-w-24">
                      {preselectedFiles.font.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreselectedFiles(prev => ({ ...prev, font: undefined }))}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(preselectedFiles.logo || preselectedFiles.favicon || preselectedFiles.font) && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                Files selected. Click "Create New" to use them in a new configuration.
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreselectedFiles({})}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Configuration</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brandingConfigs.find(c => c.isActive)?.siteName || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently applied branding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Configurations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brandingConfigs.length}</div>
            <p className="text-xs text-muted-foreground">
              Available configurations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brandingConfigs.length > 0 ? 'Today' : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              Most recent change
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configurations List */}
      <Card>
        <CardHeader>
          <CardTitle>Branding Configurations</CardTitle>
          <CardDescription>
            Manage your app's branding configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brandingConfigs.length === 0 ? (
            <div className="text-center py-8">
              <Palette className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No branding configurations</h3>
              <p className="text-muted-foreground mb-4">
                Create your first branding configuration to get started.
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Configuration
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {brandingConfigs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {config.logoUrl && (
                      <div className="w-10 h-10 border rounded flex items-center justify-center bg-gray-50">
                        <img
                          src={config.logoUrl}
                          alt={config.logoAlt || config.siteName}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{config.siteName}</h4>
                        {config.isActive && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                      {config.siteDescription && (
                        <p className="text-sm text-muted-foreground">{config.siteDescription}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div 
                            className="w-4 h-4 rounded border" 
                            style={{ backgroundColor: config.primaryColor }}
                          />
                          Primary
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div 
                            className="w-4 h-4 rounded border" 
                            style={{ backgroundColor: config.secondaryColor }}
                          />
                          Secondary
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div 
                            className="w-4 h-4 rounded border" 
                            style={{ backgroundColor: config.accentColor }}
                          />
                          Accent
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Font: {config.fontFamily}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!config.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(config.id)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(config)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>




    </div>
  );
}