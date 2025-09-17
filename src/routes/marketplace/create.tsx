import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Upload, X, Euro, Tag, Package, MapPin, School, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { EnhancedSchoolSelector } from '@/components/ui/enhanced-school-selector';

interface ProductType {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description?: string;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  productTypes: ProductType[];
}

interface Condition {
  id: string;
  name: string;
  description?: string;
}

interface Attribute {
  id: string;
  name: string;
  slug: string;
  inputType: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  values: AttributeValue[];
}

interface AttributeValue {
  id: string;
  value: string;
  displayName: string;
}

interface UploadedImage {
  id: string;
  url: string;
  altText?: string;
  order: number;
}

export const Route = createFileRoute('/marketplace/create')({
  component: CreateListingPage,
});

function CreateListingPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const [formData, setFormData] = useState({
    // Basic listing details
    title: '',
    description: '',
    schoolId: '',
    categoryId: '',
    productTypeId: '',
    conditionId: '',
    
    // Pricing
    price: '',
    isFree: false,
    
    // Attributes (dynamic based on product type)
    attributes: {} as Record<string, string>,
    
    // Images
    images: [] as UploadedImage[],
    
    // Location will come from user profile
    localityId: '',
    
    // Advanced options
    allowOffers: true,
    autoRenew: false,
    
    // Preview before publish
    isPreview: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, conditionsRes] = await Promise.all([
        fetch('/api/product-categories', { credentials: 'include' }),
        fetch('/api/conditions', { credentials: 'include' })
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.categories);
        }
      }

      if (conditionsRes.ok) {
        const conditionsData = await conditionsRes.json();
        if (conditionsData.success) {
          setConditions(conditionsData.conditions);
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductTypeAttributes = async (productTypeId: string) => {
    try {
      const response = await fetch(`/api/product-types/${productTypeId}/attributes`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAttributes(data.attributes);
          // Reset attributes when product type changes
          setFormData(prev => ({ ...prev, attributes: {} }));
        }
      }
    } catch (error) {
      console.error('Error fetching attributes:', error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.productTypeId) {
      fetchProductTypeAttributes(formData.productTypeId);
    }
  }, [formData.productTypeId]);

  const handleSchoolChange = (schoolId: string | null) => {
    setFormData(prev => ({
      ...prev,
      schoolId: schoolId || ''
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryId,
      productTypeId: '', // Reset product type when category changes
      attributes: {} // Reset attributes
    }));
    setAttributes([]);
  };

  const handleProductTypeChange = (productTypeId: string) => {
    setFormData(prev => ({
      ...prev,
      productTypeId
    }));
  };

  const handleAttributeChange = (attributeSlug: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attributeSlug]: value
      }
    }));
  };

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    setUploadingImages(true);
    const newImages: UploadedImage[] = [];
    
    try {
      for (let i = 0; i < files.length && i < 5; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'listing');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          newImages.push({
            id: data.file.id,
            url: data.file.url,
            altText: `Uniform image ${formData.images.length + newImages.length + 1}`,
            order: formData.images.length + newImages.length
          });
        }
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
      
      toast.success(`${newImages.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId).map((img, index) => ({
        ...img,
        order: index
      }))
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.schoolId) newErrors.schoolId = 'School is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.productTypeId) newErrors.productTypeId = 'Product type is required';
    if (!formData.conditionId) newErrors.conditionId = 'Condition is required';
    
    if (!formData.isFree) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = 'Valid price is required';
      }
    }
    
    // Validate required attributes
    attributes.forEach(attr => {
      if (attr.required && !formData.attributes[attr.slug]) {
        newErrors[`attr_${attr.slug}`] = `${attr.name} is required`;
      }
    });
    
    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft && !validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    setSaving(true);
    try {
      const listingData = {
        ...formData,
        price: formData.isFree ? null : parseFloat(formData.price),
        status: isDraft ? 'draft' : (formData.isPreview ? 'pending' : 'active'),
        images: formData.images.map(img => ({
          fileId: img.id,
          altText: img.altText,
          order: img.order
        }))
      };
      
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(listingData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(isDraft ? 'Draft saved successfully' : 'Listing created successfully!');
        // Redirect to listings management or the new listing
        window.location.href = `/marketplace/listings/${data.listing.id}`;
      } else {
        toast.error(data.error || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing');
    } finally {
      setSaving(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const selectedProductType = selectedCategory?.productTypes?.find(pt => pt.id === formData.productTypeId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const StepIndicator = () => (
    <div className="flex items-center space-x-4 mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
            currentStep >= step ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
          }`}>
            {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
          </div>
          {step < 4 && <div className={`h-px w-12 ${currentStep > step ? 'bg-primary' : 'bg-muted-foreground'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Listing</h1>
          <p className="text-muted-foreground">
            List your child's uniform items for other parents to find
          </p>
        </div>
      </div>

      <StepIndicator />

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

        <TabsContent value="details" className="space-y-6">
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
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the condition, size, any special features..."
                  rows={4}
                />
              </div>

              <EnhancedSchoolSelector
                selectedSchoolId={formData.schoolId}
                onSchoolChange={handleSchoolChange}
                required
                label="School *"
                placeholder="Search for the school this uniform is from..."
                className={errors.schoolId ? 'border-red-500' : ''}
              />
              {errors.schoolId && <p className="text-sm text-red-500">{errors.schoolId}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
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
                    value={formData.productTypeId} 
                    onValueChange={handleProductTypeChange}
                    disabled={!formData.categoryId}
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
                <Select value={formData.conditionId} onValueChange={(value) => setFormData({ ...formData, conditionId: value })}>
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
              {attributes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Product Details</h3>
                  {attributes.map(attribute => (
                    <div key={attribute.id}>
                      <Label htmlFor={attribute.slug}>
                        {attribute.name}
                        {attribute.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {attribute.inputType === 'text_input' ? (
                        <Input
                          id={attribute.slug}
                          value={formData.attributes[attribute.slug] || ''}
                          onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
                          placeholder={attribute.placeholder}
                          className={errors[`attr_${attribute.slug}`] ? 'border-red-500' : ''}
                        />
                      ) : (
                        <Select 
                          value={formData.attributes[attribute.slug] || ''} 
                          onValueChange={(value) => handleAttributeChange(attribute.slug, value)}
                        >
                          <SelectTrigger className={errors[`attr_${attribute.slug}`] ? 'border-red-500' : ''}>
                            <SelectValue placeholder={`Select ${attribute.name.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {attribute.values.map(value => (
                              <SelectItem key={value.id} value={value.value}>
                                {value.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {attribute.helpText && (
                        <p className="text-sm text-muted-foreground mt-1">{attribute.helpText}</p>
                      )}
                      {errors[`attr_${attribute.slug}`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`attr_${attribute.slug}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-6">
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
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
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

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.url}
                        alt={image.altText}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => removeImage(image.id)}
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

        <TabsContent value="pricing" className="space-y-6">
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
                  onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked as boolean, price: '' })}
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
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                    onCheckedChange={(checked) => setFormData({ ...formData, allowOffers: checked })}
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
                    onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
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
                    <Badge variant="secondary">{conditions.find(c => c.id === formData.conditionId)?.name}</Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPreview"
                    checked={formData.isPreview}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPreview: checked as boolean })}
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

      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={() => handleSubmit(true)} disabled={saving}>
          Save as Draft
        </Button>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={saving}>
            {saving ? 'Publishing...' : 'Publish Listing'}
          </Button>
        </div>
      </div>
    </div>
  );
}