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
import { AttributeInput, type ProductAttribute } from './attribute-input';
import { Save, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

export interface ProductFormData {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  images: string[];
  attributes: Record<string, any>;
  tags: string[];
}

interface DynamicProductFormProps {
  productType?: {
    id: string;
    name: string;
    description?: string;
    attributes: ProductAttribute[];
  };
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export function DynamicProductForm({
  productType,
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  className = ''
}: DynamicProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: 0,
    currency: '€',
    category: '',
    condition: '',
    images: [],
    attributes: {},
    tags: [],
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(formData.images || []);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      setImageUrls(initialData.images || []);
    }
  }, [initialData]);

  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateAttribute = (attributeId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [attributeId]: value }
    }));

    // Clear attribute error
    if (errors[`attribute_${attributeId}`]) {
      setErrors(prev => ({ ...prev, [`attribute_${attributeId}`]: '' }));
    }
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
    if (newTag.trim() && !imageUrls.includes(newTag.trim())) {
      const updated = [...imageUrls, newTag.trim()];
      setImageUrls(updated);
      updateField('images', updated);
      setNewTag('');
    }
  };

  const removeImage = (imageToRemove: string) => {
    const updated = imageUrls.filter(img => img !== imageToRemove);
    setImageUrls(updated);
    updateField('images', updated);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic field validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.condition) {
      newErrors.condition = 'Condition is required';
    }

    // Attribute validation
    productType?.attributes.forEach(attr => {
      if (attr.required) {
        const value = formData.attributes[attr.id];
        if (value === undefined || value === null || value === '') {
          newErrors[`attribute_${attr.id}`] = `${attr.name} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const basicConditions = [
    'New',
    'Excellent',
    'Very Good',
    'Good',
    'Fair',
    'Poor'
  ];

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the basic details for your listing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., School Blazer - Navy Blue"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-xs text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => updateField('category', value)}>
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary School</SelectItem>
                    <SelectItem value="secondary">Secondary School</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-red-500">{errors.category}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe the item condition, size, and any other relevant details..."
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || ''}
                  onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && (
                  <p className="text-xs text-red-500">{errors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select value={formData.condition} onValueChange={(value) => updateField('condition', value)}>
                  <SelectTrigger className={errors.condition ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {basicConditions.map(condition => (
                      <SelectItem key={condition} value={condition.toLowerCase()}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.condition && (
                  <p className="text-xs text-red-500">{errors.condition}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Add images of your item (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter image URL..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
              />
              <Button type="button" onClick={addImageUrl} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Add tags to help others find your item (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Attributes */}
        {productType && productType.attributes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>
                {productType.description || 'Provide specific details about this item'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {productType.attributes.map((attribute) => (
                <AttributeInput
                  key={attribute.id}
                  attribute={attribute}
                  value={formData.attributes[attribute.id]}
                  onChange={(value) => updateAttribute(attribute.id, value)}
                  error={errors[`attribute_${attribute.id}`]}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              'Saving...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {initialData.title ? 'Update Listing' : 'Create Listing'}
              </>
            )}
          </Button>

          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        {/* Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix the following errors before submitting:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </form>
  );
}