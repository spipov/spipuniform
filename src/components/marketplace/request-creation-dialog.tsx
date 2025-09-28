import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Package, Euro, Target, Upload, X } from 'lucide-react';

interface RequestCreationDialogProps {
  schoolId: string;
  schoolName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RequestCreationDialog({
  schoolId,
  schoolName,
  isOpen,
  onClose,
  onSuccess
}: RequestCreationDialogProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    categoryId: '',
    productTypeId: '',
    attributes: {} as Record<string, string>,
    conditionPreference: '',
    description: '',
    maxPrice: '',
    images: [] as { id: string; url: string; altText?: string; order: number }[],
    hasSchoolCrest: false
  });

  const [uploadingImages, setUploadingImages] = useState(false);

  // Fetch product categories
  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const response = await fetch('/api/product-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.categories;
    }
  });

  // Fetch product types for selected category
  const { data: productTypes } = useQuery({
    queryKey: ['product-types', formData.categoryId],
    queryFn: async () => {
      if (!formData.categoryId) return [];
      const response = await fetch(`/api/product-categories/${formData.categoryId}/types`);
      if (!response.ok) throw new Error('Failed to fetch product types');
      const data = await response.json();
      return data.productTypes;
    },
    enabled: !!formData.categoryId
  });

  const { data: conditions } = useQuery({
    queryKey: ['conditions'],
    queryFn: async () => {
      const response = await fetch('/api/conditions');
      if (!response.ok) throw new Error('Failed to fetch conditions');
      const data = await response.json();
      return data.conditions;
    }
  });

  // Fetch attributes for selected product type
  const { data: productAttributes } = useQuery({
    queryKey: ['product-attributes', formData.productTypeId],
    queryFn: async () => {
      if (!formData.productTypeId) return null;
      const response = await fetch(`/api/product-types/${formData.productTypeId}/attributes`);
      if (!response.ok) throw new Error('Failed to fetch attributes');
      const data = await response.json();
      return data.attributes;
    },
    enabled: !!formData.productTypeId
  });


  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Request created successfully!');
      setFormData({ categoryId: '', productTypeId: '', attributes: {}, conditionPreference: '', description: '', maxPrice: '', images: [], hasSchoolCrest: false });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleCreateRequest = () => {
    if (!formData.productTypeId) {
      toast.error('Please select a product type');
      return;
    }

    const requestData = {
      ...formData,
      schoolId,
      maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
      images: formData.images.map(img => ({
        fileId: img.id,
        altText: img.altText,
        order: img.order
      }))
    };

    createRequestMutation.mutate(requestData);
  };

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploadingImages(true);
    const newImages: { id: string; url: string; altText?: string; order: number }[] = [];

    try {
      for (let i = 0; i < files.length && i < 5; i++) {
        const file = files[i];
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('category', 'request');

        const response = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formDataUpload
        });

        if (response.ok) {
          const data = await response.json();
          newImages.push({
            id: data.file.id,
            url: data.file.url,
            altText: `Request image ${formData.images.length + newImages.length + 1}`,
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

  const handleClose = () => {
    setFormData({ categoryId: '', productTypeId: '', attributes: {}, conditionPreference: '', description: '', maxPrice: '', images: [], hasSchoolCrest: false });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Request Uniform Item
          </DialogTitle>
          <DialogDescription>
            Let other parents know what specific uniform items you're looking for from {schoolName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2 text-blue-800">
              <Package className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">School: {schoolName}</p>
                <p className="text-blue-700">
                  Your request will be visible to other parents from this school and nearby areas.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value, productTypeId: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category first" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="productType">Product Type *</Label>
              <Select
                value={formData.productTypeId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, productTypeId: value }))}
                disabled={!formData.categoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.categoryId ? "Select product type" : "Select category first"} />
                </SelectTrigger>
                <SelectContent>
                  {productTypes?.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dynamic attributes based on product type */}
          {productAttributes && productAttributes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Product Details</h3>
              {productAttributes.map((attribute: any) => (
                <div key={attribute.id}>
                  <Label htmlFor={attribute.slug}>
                    {attribute.name}
                    {attribute.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {attribute.inputType === 'text_input' ? (
                    <Input
                      id={attribute.slug}
                      value={formData.attributes[attribute.slug] || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        attributes: {
                          ...prev.attributes,
                          [attribute.slug]: e.target.value
                        }
                      }))}
                      placeholder={attribute.placeholder}
                    />
                  ) : (
                    <Select
                      value={formData.attributes[attribute.slug] || undefined}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        attributes: {
                          ...prev.attributes,
                          [attribute.slug]: value
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${attribute.name.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {attribute.values?.map((value: any) => (
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
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <Label htmlFor="condition">Condition Requirements</Label>
              <Select
                value={formData.conditionPreference}
                onValueChange={(value) => setFormData(prev => ({ ...prev, conditionPreference: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any condition</SelectItem>
                  {conditions?.map((condition: any) => (
                    <SelectItem key={condition.id} value={condition.name}>
                      {condition.name} or better
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                We'll notify you about items in your preferred condition or better
              </p>
            </div>

            <div>
              <Label htmlFor="maxPrice">Maximum Price (€)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="maxPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxPrice: e.target.value }))}
                  placeholder="Leave blank for any price"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Any specific requirements, preferred brands, colors, etc."
              rows={3}
            />
          </div>

          {/* Images */}
          <div>
            <Label>Images (Optional)</Label>
            <div className="border-2 border-dashed border-muted-foreground rounded-lg p-4 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Add photos to help others understand what you're looking for
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
                  <Button type="button" variant="outline" size="sm" disabled={uploadingImages}>
                    {uploadingImages ? 'Uploading...' : 'Choose Files'}
                  </Button>
                </Label>
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                {formData.images.map((image) => (
                  <div key={image.id} className="relative">
                    <img
                      src={image.url}
                      alt={image.altText}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-5 w-5 p-0"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* School Crest */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasSchoolCrest"
              checked={formData.hasSchoolCrest}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSchoolCrest: checked as boolean }))}
            />
            <Label htmlFor="hasSchoolCrest">Item should have school crest</Label>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2 text-green-800">
              <Search className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">What happens next?</p>
                <div className="text-green-700 mt-1 space-y-1">
                  <p>• Your request will be visible to other parents from {schoolName}</p>
                  <p>• When someone has a matching item, they'll be able to contact you directly</p>
                  <p>• We'll notify you when new listings match your requirements</p>
                  <p>• You'll only be notified about items in your preferred condition or better</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateRequest}
            disabled={createRequestMutation.isPending || !formData.productTypeId}
          >
            {createRequestMutation.isPending ? 'Creating...' : 'Request Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}