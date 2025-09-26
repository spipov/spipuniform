import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Package, Plus, Edit, Trash2, Tags, Search, MoreHorizontal, CheckCircle, XCircle, Upload, X } from 'lucide-react';

export const Route = createFileRoute('/dashboard/spipuniform/products/types')({
  component: ProductTypesPage,
});

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductType {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  imageFileId?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  categoryName?: string;
  attributesCount?: number;
}

function ProductTypesPage() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    slug: '',
    description: '',
    image: null as { id: string; url: string; altText?: string } | null
  });
  
  const filteredTypes = productTypes.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (type.categoryName && type.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || type.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/spipuniform/admin/categories/');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        toast.error('Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await fetch('/api/spipuniform/admin/product-types/');
      const data = await response.json();
      
      if (data.success) {
        setProductTypes(data.productTypes || []);
      } else {
        toast.error('Failed to load product types');
      }
    } catch (error) {
      console.error('Error fetching product types:', error);
      toast.error('Failed to load product types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchCategories(), fetchProductTypes()]);
  }, []);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.categoryId || !formData.name || !formData.slug) {
        toast.error('Please fill in all required fields');
        return;
      }

      const url = editingType 
        ? `/api/spipuniform/admin/product-types/${editingType.id}`
        : '/api/spipuniform/admin/product-types/';
      
      const method = editingType ? 'PUT' : 'POST';
      
      const submitData = {
        categoryId: formData.categoryId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        imageFileId: formData.image?.id || null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingType ? 'Product type updated successfully' : 'Product type created successfully');
        setIsDialogOpen(false);
        setEditingType(null);
        setFormData({ categoryId: '', name: '', slug: '', description: '', image: null });
        fetchProductTypes();
      } else {
        toast.error(data.error || 'Failed to save product type');
      }
    } catch (error) {
      console.error('Error saving product type:', error);
      toast.error('Failed to save product type');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product type? This will also affect all related attributes and listings.')) return;
    
    try {
      const response = await fetch(`/api/spipuniform/admin/product-types/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Product type deleted successfully');
        fetchProductTypes();
      } else {
        toast.error(data.error || 'Failed to delete product type');
      }
    } catch (error) {
      console.error('Error deleting product type:', error);
      toast.error('Failed to delete product type');
    }
  };

  const toggleActive = async (type: ProductType) => {
    try {
      const response = await fetch(`/api/spipuniform/admin/product-types/${type.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          categoryId: type.categoryId,
          name: type.name,
          slug: type.slug,
          description: type.description,
          isActive: !type.isActive 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Product type ${!type.isActive ? 'activated' : 'deactivated'}`);
        fetchProductTypes();
      } else {
        toast.error(data.error || 'Failed to update product type');
      }
    } catch (error) {
      console.error('Error toggling product type status:', error);
      toast.error('Failed to update product type');
    }
  };

  const handleEdit = (type: ProductType) => {
    setEditingType(type);
    setFormData({
      categoryId: type.categoryId,
      name: type.name,
      slug: type.slug,
      description: type.description || '',
      image: type.imageFileId ? { id: type.imageFileId, url: type.imageUrl || '', altText: `Image for ${type.name}` } : null
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingType(null);
    setFormData({
      categoryId: selectedCategory !== 'all' ? selectedCategory : '',
      name: '',
      slug: '',
      description: '',
      image: null
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;

    try {
      const file = files[0]; // Only allow one image per type
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('category', 'product_type');

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          image: {
            id: data.file.id,
            url: data.file.url,
            altText: `Type image for ${prev.name || 'new type'}`
          }
        }));
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
  };


  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Product Types
              </CardTitle>
              <CardDescription>
                Manage specific product types within categories ({productTypes.length} total)
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search product types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Attributes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <div className="font-medium">{type.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tags className="h-4 w-4 text-muted-foreground" />
                          {type.categoryName || 'Unknown Category'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {type.slug}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {type.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {type.attributesCount || 0} attributes
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={type.isActive ? 'default' : 'secondary'}>
                          {type.isActive ? (
                            <><CheckCircle className="h-3 w-3 mr-1" />Active</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />Inactive</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(type.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(type)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(type)}>
                              {type.isActive ? (
                                <><XCircle className="mr-2 h-4 w-4" />Deactivate</>
                              ) : (
                                <><CheckCircle className="mr-2 h-4 w-4" />Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(type.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredTypes.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    {productTypes.length === 0 ? 'No product types yet' : 'No matching product types'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {productTypes.length === 0 
                      ? 'Create your first product type to define specific uniform items.'
                      : 'Try adjusting your search terms or category filter.'
                    }
                  </p>
                  {productTypes.length === 0 && (
                    <Button onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Product Type
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Edit Product Type' : 'Create Product Type'}
            </DialogTitle>
            <DialogDescription>
              {editingType 
                ? 'Update the product type details below.'
                : 'Create a new product type within a category.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="categoryId">Category *</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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

            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. School Shirts"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. school-shirts"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this product type"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Product Type Image (Optional)</Label>
              <div className="border-2 border-dashed border-muted-foreground rounded-lg p-4 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop an image here, or click to browse
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                  id="type-image-upload"
                />
                <Label htmlFor="type-image-upload" className="cursor-pointer text-sm text-primary hover:underline">
                  Choose File
                </Label>
              </div>

              {formData.image && (
                <div className="relative inline-block">
                  <img
                    src={formData.image.url}
                    alt={formData.image.altText}
                    className="w-32 h-32 object-cover rounded border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={removeImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingType ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}