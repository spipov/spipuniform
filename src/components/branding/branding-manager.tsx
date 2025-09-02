import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, Settings, Plus, Edit, Trash2, Check, Save, X, 
  Image, Upload, AlertCircle, Loader2, FolderOpen, Type 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileChooser } from '@/components/file-system/file-chooser';
import type { FileItem } from '@/db/schema';

// Simple, clean interfaces
interface BrandingConfig {
  id?: string;
  siteName: string;
  siteDescription?: string;
  siteUrl?: string;
  logoUrl?: string;
  logoAlt?: string;
  faviconUrl?: string;
  logoDisplayMode?: 'logo-only' | 'logo-with-name' | 'name-only';
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  headingFont?: string;
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
  isActive?: boolean;
  version?: string;
}

// Predefined font options
const FONT_OPTIONS = [
  'Inter',
  'Roboto', 
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans Pro',
  'Nunito',
  'Custom Font'
];

// Default values
const DEFAULT_CONFIG: Partial<BrandingConfig> = {
  logoDisplayMode: 'logo-with-name',
  primaryColor: '#3b82f6',
  secondaryColor: '#64748b', 
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  fontFamily: 'Inter',
  headingFont: 'Inter',
  borderRadius: '0.5rem',
  spacing: '1rem',
  version: '1.0.0',
  isActive: false,
};

// Advanced file selection component with file chooser
interface FileSelectionProps {
  type: 'logo' | 'favicon' | 'font';
  accept: string;
  onFileSelect: (file: FileItem | File) => void;
  currentValue?: string;
  placeholder: string;
  className?: string;
}

function FileSelection({ type, accept, onFileSelect, currentValue, placeholder, className }: FileSelectionProps) {
  const [showFileChooser, setShowFileChooser] = useState(false);

  const handleDirectUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleFileChooserSelect = (file: FileItem) => {
    onFileSelect(file);
    setShowFileChooser(false);
  };

  const handleRemove = () => {
    // Clear the current value by triggering onFileSelect with a fake empty file
    const emptyFile = new File([], '', { type: 'image/png' });
    Object.defineProperty(emptyFile, 'name', { value: '' });
    onFileSelect(emptyFile);
  };

  if (showFileChooser) {
    return (
      <div className={`space-y-4 ${className}`}>
        <FileChooser
          type={type}
          accept={accept}
          onFileSelect={handleFileChooserSelect}
          onCancel={() => setShowFileChooser(false)}
          title={`Select ${type === 'logo' ? 'Logo' : type === 'favicon' ? 'Favicon' : 'Font'}`}
          description="Choose a file from your file system or upload a new one"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="file"
            accept={accept}
            onChange={handleDirectUpload}
            className="cursor-pointer"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowFileChooser(true)}
          className="flex items-center gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          Browse
        </Button>
        {currentValue && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {currentValue && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Current: {currentValue}
          </div>
          {(type === 'logo' || type === 'favicon') && (
            <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
              <img
                src={currentValue}
                alt={`Current ${type}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        {placeholder}
      </div>
    </div>
  );
}

// Color picker component
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 p-1 border rounded cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono"
        />
      </div>
    </div>
  );
}

// Main component
export function BrandingManager() {
  const [configs, setConfigs] = useState<BrandingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BrandingConfig | null>(null);
  const [formData, setFormData] = useState<BrandingConfig>({ siteName: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Load configurations
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/branding');
      const result = await response.json();
      
      if (result.success) {
        setConfigs(result.data || []);
      } else {
        toast.error('Failed to load branding configurations');
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast.error('Failed to load branding configurations');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form changes
  const handleChange = (field: keyof BrandingConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user makes changes
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Handle social links
  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value.trim() || undefined
      }
    }));
  };

  // Handle file uploads and selections
  const handleFileSelection = async (fileOrItem: File | FileItem, field: 'logoUrl' | 'faviconUrl') => {
    // Handle FileItem (from file chooser)
    if ('url' in fileOrItem && fileOrItem.url) {
      handleChange(field, fileOrItem.url);
      toast.success(`${field === 'logoUrl' ? 'Logo' : 'Favicon'} selected successfully`);
      return;
    }

    // Handle File (direct upload)
    const file = fileOrItem as File;
    if (!file.name) {
      // Remove file
      handleChange(field, undefined);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('path', '/uploads/images');
      formData.append('category', 'images');

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.data?.uploadedFiles?.length > 0) {
        const fileUrl = result.data.uploadedFiles[0].url;
        handleChange(field, fileUrl);
        toast.success(`${field === 'logoUrl' ? 'Logo' : 'Favicon'} uploaded successfully`);
      } else {
        const apiError = result?.error || 'Failed to upload file';
        toast.error(`Failed to upload ${field === 'logoUrl' ? 'logo' : 'favicon'}: ${apiError}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${field === 'logoUrl' ? 'logo' : 'favicon'}`);
    }
  };

  // Handle font selection (new function)
  const handleFontSelection = (fileOrItem: File | FileItem) => {
    // Handle FileItem (from file chooser)
    if ('url' in fileOrItem && fileOrItem.url) {
      // For custom fonts, we might want to extract the font family name from filename
      const fontName = fileOrItem.name.replace(/\.(woff2?|ttf|otf)$/i, '');
      handleChange('fontFamily', fontName);
      toast.success(`Font "${fontName}" selected successfully`);
      return;
    }

    // Handle File (direct upload) - would need to upload first
    const file = fileOrItem as File;
    if (file.name) {
      // For now, just show the file name as this requires more complex font handling
      const fontName = file.name.replace(/\.(woff2?|ttf|otf)$/i, '');
      toast.success(`Font "${fontName}" selected (upload implementation needed)`);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.siteName?.trim()) {
      newErrors.push('App name is required');
    }

    // Validate URLs if provided
    const urlFields = [
      { field: 'siteUrl', label: 'Site URL' },
      { field: 'supportEmail', label: 'Support Email' }
    ] as const;

    urlFields.forEach(({ field, label }) => {
      const value = formData[field];
      if (value && value.trim()) {
        if (field === 'supportEmail') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            newErrors.push(`${label} must be a valid email address`);
          }
        } else {
          try {
            new URL(value.trim());
          } catch {
            newErrors.push(`${label} must be a valid URL`);
          }
        }
      }
    });

    // Validate social links
    if (formData.socialLinks) {
      Object.entries(formData.socialLinks).forEach(([platform, url]) => {
        if (url && url.trim()) {
          try {
            new URL(url.trim());
          } catch {
            newErrors.push(`${platform} URL must be a valid URL`);
          }
        }
      });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Save configuration
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      
      // Clean data - remove empty strings and undefined values
      const cleanData: any = {
        siteName: formData.siteName.trim(),
        ...DEFAULT_CONFIG,
        ...formData
      };

      // Clean optional string fields
      ['siteDescription', 'siteUrl', 'logoUrl', 'logoAlt', 'faviconUrl', 'supportEmail', 'contactPhone', 'customCss'].forEach(field => {
        if (cleanData[field] && typeof cleanData[field] === 'string') {
          cleanData[field] = cleanData[field].trim() || undefined;
        }
      });

      // Clean social links
      if (cleanData.socialLinks) {
        const cleanedSocialLinks: any = {};
        Object.entries(cleanData.socialLinks).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.trim()) {
            cleanedSocialLinks[key] = value.trim();
          }
        });
        cleanData.socialLinks = Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : undefined;
      }

      const url = '/api/branding';
      const method = editingConfig ? 'PUT' : 'POST';
      const payload = editingConfig ? { ...cleanData, id: editingConfig.id } : cleanData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingConfig ? 'Configuration updated' : 'Configuration created');
        setIsDialogOpen(false);
        setEditingConfig(null);
        setFormData({ siteName: '' });
        await loadConfigurations();
      } else {
        const serverIssues = result?.details as any[] | undefined;
        if (Array.isArray(serverIssues) && serverIssues.length > 0) {
          // Map valibot issues to readable messages
          const msgs = serverIssues.map((i) => {
            const path = Array.isArray(i.path) ? i.path.map((p: any) => (p.key ?? p)).join('.') : '';
            return path ? `${path}: ${i.message}` : i.message || 'Validation error';
          });
          setErrors(msgs);
        }
        toast.error(result.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle edit
  const handleEdit = (config: BrandingConfig) => {
    setEditingConfig(config);
    setFormData({ ...DEFAULT_CONFIG, ...config });
    setIsDialogOpen(true);
  };

  // Handle create new
  const handleCreateNew = () => {
    setEditingConfig(null);
    setFormData({ siteName: '', ...DEFAULT_CONFIG });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/branding?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Configuration deleted');
        await loadConfigurations();
      } else {
        toast.error(result.error || 'Failed to delete configuration');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete configuration');
    }
  };

  // Handle activate
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
        toast.success('Configuration activated');
        await loadConfigurations();
      } else {
        toast.error(result.error || 'Failed to activate configuration');
      }
    } catch (error) {
      console.error('Activate error:', error);
      toast.error('Failed to activate configuration');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branding</h1>
          <p className="text-muted-foreground">Manage your application's visual identity</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Configuration
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit Configuration' : 'Create Configuration'}
              </DialogTitle>
              <DialogDescription>
                Configure your application's branding and visual identity
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Errors */}
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Essential details about your application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="siteName">
                      App Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="siteName"
                      value={formData.siteName}
                      onChange={(e) => handleChange('siteName', e.target.value)}
                      placeholder="Enter your app name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="siteDescription">Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={formData.siteDescription || ''}
                      onChange={(e) => handleChange('siteDescription', e.target.value)}
                      placeholder="Brief description of your application"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="siteUrl">Website URL</Label>
                    <Input
                      id="siteUrl"
                      value={formData.siteUrl || ''}
                      onChange={(e) => handleChange('siteUrl', e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Visual Identity */}
              <Card>
                <CardHeader>
                  <CardTitle>Visual Identity</CardTitle>
                  <CardDescription>Logo, favicon, and display preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Logo</Label>
                      <FileSelection
                        type="logo"
                        accept="image/*"
                        onFileSelect={(file) => handleFileSelection(file, 'logoUrl')}
                        currentValue={formData.logoUrl}
                        placeholder="Upload or choose your application logo"
                      />
                    </div>
                    
                    <div>
                      <Label>Favicon</Label>
                      <FileSelection
                        type="favicon"
                        accept="image/*"
                        onFileSelect={(file) => handleFileSelection(file, 'faviconUrl')}
                        currentValue={formData.faviconUrl}
                        placeholder="Upload or choose your favicon (ICO, PNG)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logoAlt">Logo Alt Text</Label>
                      <Input
                        id="logoAlt"
                        value={formData.logoAlt || ''}
                        onChange={(e) => handleChange('logoAlt', e.target.value)}
                        placeholder="Describe your logo for accessibility"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="logoDisplayMode">Logo Display</Label>
                      <Select
                        value={formData.logoDisplayMode}
                        onValueChange={(value) => handleChange('logoDisplayMode', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="logo-only">Logo Only</SelectItem>
                          <SelectItem value="logo-with-name">Logo + Name</SelectItem>
                          <SelectItem value="name-only">Name Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Colors */}
              <Card>
                <CardHeader>
                  <CardTitle>Color Palette</CardTitle>
                  <CardDescription>Define your application's color scheme</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ColorPicker
                    label="Primary"
                    value={formData.primaryColor || DEFAULT_CONFIG.primaryColor!}
                    onChange={(value) => handleChange('primaryColor', value)}
                  />
                  <ColorPicker
                    label="Secondary"
                    value={formData.secondaryColor || DEFAULT_CONFIG.secondaryColor!}
                    onChange={(value) => handleChange('secondaryColor', value)}
                  />
                  <ColorPicker
                    label="Accent"
                    value={formData.accentColor || DEFAULT_CONFIG.accentColor!}
                    onChange={(value) => handleChange('accentColor', value)}
                  />
                  <ColorPicker
                    label="Background"
                    value={formData.backgroundColor || DEFAULT_CONFIG.backgroundColor!}
                    onChange={(value) => handleChange('backgroundColor', value)}
                  />
                  <ColorPicker
                    label="Text"
                    value={formData.textColor || DEFAULT_CONFIG.textColor!}
                    onChange={(value) => handleChange('textColor', value)}
                  />
                </CardContent>
              </Card>

              {/* Typography */}
              <Card>
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                  <CardDescription>Font and text styling preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fontFamily">Body Font</Label>
                      <Select
                        value={formData.fontFamily}
                        onValueChange={(value) => handleChange('fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(font => (
                            <SelectItem key={font} value={font}>{font}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="headingFont">Heading Font</Label>
                      <Select
                        value={formData.headingFont}
                        onValueChange={(value) => handleChange('headingFont', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(font => (
                            <SelectItem key={font} value={font}>{font}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Custom Font Upload */}
                  {(formData.fontFamily === 'Custom Font' || formData.headingFont === 'Custom Font') && (
                    <div className="pt-4 border-t">
                      <Label className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Custom Font File
                      </Label>
                      <FileSelection
                        type="font"
                        accept=".woff,.woff2,.ttf,.otf"
                        onFileSelect={handleFontSelection}
                        currentValue={undefined}
                        placeholder="Upload or choose a custom font file (WOFF, WOFF2, TTF, OTF)"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Custom fonts will be loaded and available for use in your application.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact & Social */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact & Social</CardTitle>
                  <CardDescription>Contact information and social media links</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={formData.supportEmail || ''}
                        onChange={(e) => handleChange('supportEmail', e.target.value)}
                        placeholder="support@yourapp.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone || ''}
                        onChange={(e) => handleChange('contactPhone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="twitter">Twitter/X</Label>
                      <Input
                        id="twitter"
                        value={formData.socialLinks?.twitter || ''}
                        onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                        placeholder="https://twitter.com/yourapp"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={formData.socialLinks?.facebook || ''}
                        onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                        placeholder="https://facebook.com/yourapp"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={formData.socialLinks?.linkedin || ''}
                        onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/company/yourapp"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.socialLinks?.instagram || ''}
                        onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                        placeholder="https://instagram.com/yourapp"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="github">GitHub</Label>
                      <Input
                        id="github"
                        value={formData.socialLinks?.github || ''}
                        onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                        placeholder="https://github.com/yourapp"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced */}
              <Card>
                <CardHeader>
                  <CardTitle>Advanced</CardTitle>
                  <CardDescription>Additional styling and customization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="borderRadius">Border Radius</Label>
                      <Input
                        id="borderRadius"
                        value={formData.borderRadius || ''}
                        onChange={(e) => handleChange('borderRadius', e.target.value)}
                        placeholder="0.5rem"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="spacing">Spacing</Label>
                      <Input
                        id="spacing"
                        value={formData.spacing || ''}
                        onChange={(e) => handleChange('spacing', e.target.value)}
                        placeholder="1rem"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customCss">Custom CSS</Label>
                    <Textarea
                      id="customCss"
                      value={formData.customCss || ''}
                      onChange={(e) => handleChange('customCss', e.target.value)}
                      placeholder="/* Add custom CSS here */"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dialog Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingConfig ? 'Update' : 'Create'}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Configurations List */}
      <div className="grid gap-4">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Palette className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No configurations yet</h3>
              <p className="text-muted-foreground mb-4">Create your first branding configuration to get started.</p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Configuration
              </Button>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <Card key={config.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {config.logoUrl && (
                      <div className="w-12 h-12 border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                        <img
                          src={config.logoUrl}
                          alt={config.logoAlt || config.siteName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{config.siteName}</h3>
                        {config.isActive && <Badge>Active</Badge>}
                      </div>
                      {config.siteDescription && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {config.siteDescription}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Display: {config.logoDisplayMode || 'logo-with-name'}</span>
                        <span>Font: {config.fontFamily || 'Inter'}</span>
                        {config.primaryColor && (
                          <div className="flex items-center gap-1">
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: config.primaryColor }}
                            />
                            <span>Primary</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!config.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(config.id!)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(config)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config.id!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}