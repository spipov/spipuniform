import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Hash,
  School,
  Loader2,
  Upload,
  X
} from 'lucide-react';

interface SchoolStock {
  id: string;
  schoolId: string;
  managedByUserId: string;
  productTypeId: string;
  title: string;
  description?: string;
  categoryId: string;
  attributes?: Record<string, string>;
  conditionId: string;
  quantity: number;
  price?: number;
  isFree: boolean;
  hasSchoolCrest: boolean;
  status: 'active' | 'sold' | 'removed';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  schoolName: string;
  productTypeName: string;
  categoryName: string;
  conditionName: string;
  imageCount: number;
}

interface ProductType {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
}

interface Condition {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface SchoolStockManagerProps {
  schoolId: string;
  userId: string;
}

export function SchoolStockManager({ schoolId, userId }: SchoolStockManagerProps) {
  const [stock, setStock] = useState<SchoolStock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<SchoolStock | null>(null);


  // Form state
  const [formData, setFormData] = useState({
    productTypeId: '',
    title: '',
    description: '',
    categoryId: '',
    attributes: {} as Record<string, string>,
    conditionId: '',
    quantity: 1,
    price: '',
    isFree: false,
    images: [] as { id: string; url: string; altText?: string }[],
    hasSchoolCrest: false
  });

  const fetchStock = async () => {
    try {
      const response = await fetch(`/api/spipuniform/school-stock?schoolId=${schoolId}&managedByUserId=${userId}`, {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.success) {
        setStock(result.stock);
      } else {
        toast.error(result.error || 'Failed to load school stock');
      }
    } catch (error) {
      console.error('Error fetching school stock:', error);
      toast.error('Failed to load school stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductTypes = async (categoryId?: string) => {
    try {
      const url = categoryId ? `/api/product-types?categoryId=${categoryId}` : '/api/product-types';
      const response = await fetch(url, { credentials: 'include' });
      const result = await response.json();
      if (result.success) {
        setProductTypes(result.productTypes);
      }
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/spipuniform/admin/categories', { credentials: 'include' });
      const result = await response.json();
      if (result.success) {
        setCategories(result.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchConditions = async () => {
    try {
      const response = await fetch('/api/conditions', { credentials: 'include' });
      const result = await response.json();
      if (result.success) {
        setConditions(result.conditions);
      }
    } catch (error) {
      console.error('Error fetching conditions:', error);
    }
  };

  const fetchProductTypeAttributes = async (productTypeId: string) => {
    if (!productTypeId) return;
    try {
      const response = await fetch(`/api/product-types/${productTypeId}/attributes`, {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        setAttributes(result.attributes);
      }
    } catch (error) {
      console.error('Error fetching attributes:', error);
    }
  };

  useEffect(() => {
    fetchStock();
    fetchCategories();
    fetchProductTypes();
    fetchConditions();
  }, [schoolId, userId]);

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryId,
      productTypeId: '',
      attributes: {}
    }));
    setAttributes([]);
    fetchProductTypes(categoryId);
  };

  const handleProductTypeChange = (productTypeId: string) => {
    const selectedType = productTypes.find(pt => pt.id === productTypeId);
    setFormData(prev => ({
      ...prev,
      productTypeId,
      categoryId: selectedType?.categoryId || ''
    }));
    fetchProductTypeAttributes(productTypeId);
  };

  const handleCreateStock = async () => {
    if (!formData.categoryId || !formData.productTypeId || !formData.title || !formData.conditionId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/spipuniform/school-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          schoolId,
          managedByUserId: userId,
          price: formData.price ? parseFloat(formData.price) : undefined,
          images: formData.images.map(img => ({
            fileId: img.id,
            altText: img.altText,
            order: formData.images.indexOf(img)
          }))
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('School stock item created successfully');
        setCreateDialogOpen(false);
        resetForm();
        fetchStock();
      } else {
        toast.error(result.error || 'Failed to create stock item');
      }
    } catch (error) {
      console.error('Error creating stock:', error);
      toast.error('Failed to create stock item');
    }
  };

  const handleUpdateStock = async () => {
    if (!editingStock) return;

    try {
      const response = await fetch(`/api/spipuniform/school-stock/${editingStock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : undefined
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Stock item updated successfully');
        setEditingStock(null);
        resetForm();
        fetchStock();
      } else {
        toast.error(result.error || 'Failed to update stock item');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock item');
    }
  };

  const handleDeleteStock = async (stockId: string) => {
    try {
      const response = await fetch(`/api/spipuniform/school-stock/${stockId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Stock item deleted successfully');
        fetchStock();
      } else {
        toast.error(result.error || 'Failed to delete stock item');
      }
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast.error('Failed to delete stock item');
    }
  };

  const resetForm = () => {
    setFormData({
      productTypeId: '',
      title: '',
      description: '',
      categoryId: '',
      attributes: {},
      conditionId: '',
      quantity: 1,
      price: '',
      isFree: false,
      images: [],
      hasSchoolCrest: false
    });
  };

  const startEditing = (stockItem: SchoolStock) => {
    setEditingStock(stockItem);
    setFormData({
      productTypeId: stockItem.productTypeId,
      title: stockItem.title,
      description: stockItem.description || '',
      categoryId: stockItem.categoryId,
      attributes: {}, // TODO: load existing attributes if stored
      conditionId: stockItem.conditionId,
      quantity: stockItem.quantity,
      price: stockItem.price?.toString() || '',
      isFree: stockItem.isFree,
      images: [], // TODO: load existing images
      hasSchoolCrest: false // TODO: load existing value
    });
    // Load product types for the category
    fetchProductTypes(stockItem.categoryId);
    // Load attributes for the product type
    fetchProductTypeAttributes(stockItem.productTypeId);
  };

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;

    try {
      for (let i = 0; i < files.length && i < 5; i++) {
        const file = files[i];
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('category', 'school_stock');

        const response = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formDataUpload
        });

        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, {
              id: data.file.id,
              url: data.file.url,
              altText: `School stock image ${prev.images.length + 1}`
            }]
          }));
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    }
  };

  const removeImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading school stock...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <School className="h-6 w-6" />
            School Stock Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage leftover uniform items for your school
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Stock Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add School Stock Item</DialogTitle>
              <DialogDescription>
                Add a new uniform item to your school's stock
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Product Category *</Label>
                  <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type *</Label>
                  <Select value={formData.productTypeId} onValueChange={handleProductTypeChange} disabled={!formData.categoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <Select value={formData.conditionId} onValueChange={(value) => setFormData(prev => ({ ...prev, conditionId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition.id} value={condition.id}>
                          {condition.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Navy School Jumper - Size 10-11"
                />
              </div>

              {/* Dynamic attributes based on product type */}
              {attributes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Product Details</h3>
                  {attributes.map((attribute: any) => (
                    <div key={attribute.id} className="space-y-2">
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
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity field - always shown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    disabled={formData.isFree}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="isFree"
                    checked={formData.isFree}
                    onChange={(e) => setFormData(prev => ({ ...prev, isFree: e.target.checked }))}
                  />
                  <Label htmlFor="isFree">Free item</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about the item..."
                  rows={3}
                />
              </div>

              {/* School Crest */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasSchoolCrest"
                  checked={formData.hasSchoolCrest}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasSchoolCrest: e.target.checked }))}
                />
                <Label htmlFor="hasSchoolCrest">Item has school crest</Label>
              </div>

              <div className="space-y-2">
                <Label>Images (Optional)</Label>
                <div className="border-2 border-dashed border-muted-foreground rounded-lg p-4 text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop images here, or click to browse
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer text-sm text-primary hover:underline">
                    Choose Files
                  </Label>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.images.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.url}
                          alt={image.altText}
                          className="w-full h-20 object-cover rounded"
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
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreateStock}>
                Add Stock Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Current Stock ({stock.length} items)
          </CardTitle>
          <CardDescription>
            Uniform items available from your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stock.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stock items yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first school uniform item to get started
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.productTypeName}</TableCell>
                    <TableCell>
                      {item.attributes ? Object.values(item.attributes).join(', ') : '-'}
                      {item.hasSchoolCrest && <Badge variant="outline" className="ml-2 text-xs">Crest</Badge>}
                    </TableCell>
                    <TableCell>{item.conditionName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {item.quantity}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.isFree ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : item.price ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          €{item.price.toFixed(2)}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'active' ? 'default' :
                          item.status === 'sold' ? 'secondary' : 'destructive'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEditing(item)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Stock Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteStock(item.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingStock && (
        <Dialog open={!!editingStock} onOpenChange={() => setEditingStock(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Stock Item</DialogTitle>
              <DialogDescription>
                Update the details of this stock item
              </DialogDescription>
            </DialogHeader>

            {/* Same form as create dialog */}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Product Category *</Label>
                  <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-productType">Product Type *</Label>
                  <Select value={formData.productTypeId} onValueChange={handleProductTypeChange} disabled={!formData.categoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-condition">Condition *</Label>
                  <Select value={formData.conditionId} onValueChange={(value) => setFormData(prev => ({ ...prev, conditionId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition.id} value={condition.id}>
                          {condition.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Navy School Jumper - Size 10-11"
                />
              </div>

              {/* Dynamic attributes based on product type */}
              {attributes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Product Details</h3>
                  {attributes.map((attribute: any) => (
                    <div key={attribute.id} className="space-y-2">
                      <Label htmlFor={`edit-${attribute.slug}`}>
                        {attribute.name}
                        {attribute.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {attribute.inputType === 'text_input' ? (
                        <Input
                          id={`edit-${attribute.slug}`}
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
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity field - always shown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (€)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    disabled={formData.isFree}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="edit-isFree"
                    checked={formData.isFree}
                    onChange={(e) => setFormData(prev => ({ ...prev, isFree: e.target.checked }))}
                  />
                  <Label htmlFor="edit-isFree">Free item</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about the item..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setEditingStock(null); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStock}>
                Update Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}