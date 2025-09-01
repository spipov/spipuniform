import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Eye, Settings, Plus, Edit, Trash2, Check, Upload, Image, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface BrandingConfig {
  id: string;
  siteName: string;
  siteDescription?: string;
  siteUrl?: string;
  logoUrl?: string;
  logoAltText?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headingFont?: string;
  fontSize: string;
  lineHeight: string;
  isActive: boolean;
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
  { value: 'Nunito', label: 'Nunito' }
];

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
      logoUrl: '',
      logoAltText: '',
      faviconUrl: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'Inter',
      headingFont: 'Inter',
      fontSize: '16px',
      lineHeight: '1.5',
      isActive: false
    });
    setLogoPreview(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedConfig(null);
    setFormData({});
    setLogoPreview(null);
  };

  const handleInputChange = (field: keyof BrandingConfig, value: string | boolean) => {
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {selectedConfig ? 'Edit Branding Configuration' : 'Create New Branding Configuration'}
          </h2>
          <div className="flex gap-2">
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
                <Label htmlFor="logo">Logo Upload</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer"
                    />
                  </div>
                  {logoPreview && (
                    <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-gray-50">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="logoAltText">Logo Alt Text</Label>
                <Input
                  id="logoAltText"
                  value={formData.logoAltText || ''}
                  onChange={(e) => handleInputChange('logoAltText', e.target.value)}
                  placeholder="Descriptive text for your logo"
                />
              </div>
              <div>
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  value={formData.faviconUrl || ''}
                  onChange={(e) => handleInputChange('faviconUrl', e.target.value)}
                  placeholder="URL to your favicon"
                />
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
                <Select
                  value={formData.fontFamily || 'Inter'}
                  onValueChange={(value) => handleInputChange('fontFamily', value)}
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
                  </SelectContent>
                </Select>
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
        </div>
      </div>
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
                          alt={config.logoAltText || config.siteName}
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