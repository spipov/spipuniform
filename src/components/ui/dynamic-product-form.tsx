import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { AttributeInput, type ProductAttribute } from './attribute-input';
import { EnhancedSchoolSelector } from './enhanced-school-selector';
import { Save, Upload, X, AlertCircle, CheckCircle, Euro, Package, MapPin, School, Info } from 'lucide-react';

export interface ProductFormData {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  images: Array<string | { id: string; url: string; altText?: string; order: number }>;
  attributes: Record<string, any>;
  tags: string[];
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  productTypes: ProductType[];
}

interface ProductType {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description?: string;
}

interface Condition {
  id: string;
  name: string;
  description?: string;
}

interface UploadedImage {
  id: string;
  url: string;
  altText?: string;
  order: number;
}

interface MarketplaceFormData extends ProductFormData {
  schoolId: string;
  categoryId: string;
  productTypeId: string;
  conditionId: string;
  isFree: boolean;
  allowOffers: boolean;
  autoRenew: boolean;
  isPreview: boolean;
  images: UploadedImage[];
}

interface DynamicProductFormProps {
  // Data
  categories: ProductCategory[];
  conditions: Condition[];
  productType?: {
    id: string;
    name: string;
    description?: string;
    attributes: ProductAttribute[];
  };

  // Form state
  selectedSchoolId?: string;
  selectedCategoryId?: string;
  selectedProductTypeId?: string;
  selectedConditionId?: string;

  // Event handlers
  onSchoolChange?: (schoolId: string | null) => void;
  onCategoryChange?: (categoryId: string) => void;
  onProductTypeChange?: (productTypeId: string) => void;
  onConditionChange?: (conditionId: string) => void;
  onImageUpload?: (files: FileList) => void;
  onImageRemove?: (imageId: string) => void;

  // Form data
  initialData?: Partial<MarketplaceFormData>;
  onSubmit: (data: MarketplaceFormData) => void;
  onCancel?: () => void;

  // UI state
  loading?: boolean;
  uploadingImages?: boolean;
  errors?: Record<string, string>;
  className?: string;
}

export function DynamicProductForm({
  categories,
  conditions,
  productType,
  selectedSchoolId,
  selectedCategoryId,
  selectedProductTypeId,
  selectedConditionId,
  onSchoolChange,
  onCategoryChange,
  onProductTypeChange,
  onConditionChange,
  onImageUpload,
  onImageRemove,
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  uploadingImages = false,
  errors = {},
  className = ''
}: DynamicProductFormProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState<MarketplaceFormData>({
    title: '',
    description: '',
    price: 0,
    currency: '€',
    category: '',
    condition: '',
    images: [],
    attributes: {},
    tags: [],
    schoolId: '',
    categoryId: '',
    productTypeId: '',
    conditionId: '',
    isFree: false,
    allowOffers: true,
    autoRenew: false,
    isPreview: false,
    ...initialData
  });

  const [newTag, setNewTag] = useState('');
  const [imageUrls, setImageUrls] = useState<Array<string | { id: string; url: string; altText?: string; order: number }>>(formData.images || []);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      setImageUrls(initialData.images || []);
    }
  }, [initialData]);

  const updateField = (field: keyof MarketplaceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when field is updated
    if (errors[field]) {
      // Error clearing logic would go here
    }
  };

  const updateAttribute = (attributeId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [attributeId]: value }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateField('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateField('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const addImageUrl = () => {
    if (newTag.trim() && !imageUrls.some(img => typeof img === 'string' ? img === newTag.trim() : img.url === newTag.trim())) {
      const updated = [...imageUrls, newTag.trim()];
      setImageUrls(updated);
      updateField('images', updated);
      setNewTag('');
    }
  };

  const removeImage = (imageToRemove: string | { id: string; url: string; altText?: string; order: number }) => {
    const updated = imageUrls.filter(img =>
      typeof img === 'string' ? img !== imageToRemove : img.id !== (imageToRemove as any).id
    );
    setImageUrls(updated);
    updateField('images', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedProductType = selectedCategory?.productTypes?.find(pt => pt.id === selectedProductTypeId);

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <Euro className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
              <CardDescription>
                Tell us about the uniform item you're selling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Listing Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Navy School Jumper - Age 7-8, Excellent Condition"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe the condition, size, any special features..."
                  rows={4}
                />
              </div>

              <EnhancedSchoolSelector
                selectedSchoolId={selectedSchoolId}
                onSchoolChange={(schoolId) => onSchoolChange?.(schoolId)}
                required
                label="School *"
                placeholder="Search for the school this uniform is from..."
                className={errors.schoolId ? 'border-red-500' : ''}
              />
              {errors.schoolId && <p className="text-sm text-red-500">{errors.schoolId}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
                    <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-sm text-red-500 mt-1">{errors.categoryId}</p>}
                </div>

                <div>
                  <Label htmlFor="productType">Product Type *</Label>
                  <Select
                    value={selectedProductTypeId}
                    onValueChange={onProductTypeChange}
                    disabled={!selectedCategoryId}
                  >
                    <SelectTrigger className={errors.productTypeId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory?.productTypes?.map(productType => (
                        <SelectItem key={productType.id} value={productType.id}>
                          {productType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.productTypeId && <p className="text-sm text-red-500 mt-1">{errors.productTypeId}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="condition">Condition *</Label>
                <Select value={selectedConditionId} onValueChange={onConditionChange}>
                  <SelectTrigger className={errors.conditionId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map(condition => (
                      <SelectItem key={condition.id} value={condition.id}>
                        <div>
                          <div className="font-medium">{condition.name}</div>
                          {condition.description && (
                            <div className="text-sm text-muted-foreground">{condition.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.conditionId && <p className="text-sm text-red-500 mt-1">{errors.conditionId}</p>}
              </div>

              {/* Dynamic attributes based on product type */}
              {productType && productType.attributes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Product Details</h3>
                  {productType.attributes.map((attribute) => (
                    <AttributeInput
                      key={attribute.id}
                      attribute={attribute}
                      value={formData.attributes[attribute.id]}
                      onChange={(value) => updateAttribute(attribute.id, value)}
                      error={errors[`attr_${attribute.id}`]}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Add clear photos of your uniform item. Good photos help your item sell faster!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Upload Photos</h3>
                  <p className="text-muted-foreground">
                    Drag and drop photos here, or click to browse
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && onImageUpload?.(e.target.files)}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button type="button" disabled={uploadingImages}>
                      {uploadingImages ? 'Uploading...' : 'Choose Files'}
                    </Button>
                  </Label>
                </div>
              </div>

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageUrls.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={typeof img === 'string' ? img : img.url}
                        alt={`Uniform image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => removeImage(img)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {index === 0 && (
                        <Badge className="absolute bottom-2 left-2 text-xs">
                          Main Photo
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {errors.images && <p className="text-sm text-red-500">{errors.images}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Options</CardTitle>
              <CardDescription>
                Set your price and listing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFree"
                  checked={formData.isFree}
                  onCheckedChange={(checked) => updateField('isFree', checked as boolean)}
                />
                <Label htmlFor="isFree">This item is free</Label>
              </div>

              {!formData.isFree && (
                <div>
                  <Label htmlFor="price">Price (EUR) *</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price || ''}
                      onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={`pl-10 ${errors.price ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Offers</Label>
                    <p className="text-sm text-muted-foreground">
                      Let buyers make offers on your item
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowOffers}
                    onCheckedChange={(checked) => updateField('allowOffers', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-renew</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically renew this listing when it expires
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoRenew}
                    onCheckedChange={(checked) => updateField('autoRenew', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Your Listing</CardTitle>
              <CardDescription>
                Check everything looks good before publishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-bold text-lg">{formData.title}</h3>
                  <p className="text-muted-foreground">{formData.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {!formData.isFree && (
                      <Badge className="bg-green-500">€{formData.price}</Badge>
                    )}
                    {formData.isFree && <Badge variant="outline">FREE</Badge>}
                    <Badge variant="secondary">{conditions.find(c => c.id === selectedConditionId)?.name}</Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPreview"
                    checked={formData.isPreview}
                    onCheckedChange={(checked) => updateField('isPreview', checked as boolean)}
                  />
                  <Label htmlFor="isPreview">Submit for review before publishing</Label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Ready to publish?</p>
                      <p>
                        Your listing will be visible to other parents looking for uniforms from this school.
                        {formData.isPreview && " It will be reviewed by our team before going live."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-6 border-t mt-6">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setActiveTab('preview')}>
            Preview
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Listing'}
          </Button>
        </div>
      </div>
    </div>
  );
}