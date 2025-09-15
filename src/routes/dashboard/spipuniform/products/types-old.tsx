import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Package, Plus, Edit, Trash2, Tags, Search, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/spipuniform/products/types')({
  component: ProductTypesPage,
});

interface ProductType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  categoryId: string;
  attributes: Array<{
    id: string;
    name: string;
    slug: string;
    inputType: string;
    required: boolean;
  }>;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface TypeFormData {
  name: string;
  description: string;
  categoryId: string;
  isActive: boolean;
}

function ProductTypesPage() {
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [formData, setFormData] = useState<TypeFormData>({
    name: '',
    description: '',
    categoryId: '',
    isActive: true
  });

  const queryClient = useQueryClient();

  // Fetch categories and types
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['spipuniform-categories'],
    queryFn: async () => {
      const res = await fetch('/api/spipuniform/admin/categories');
      if (!res.ok) throw new Error('Failed to load data');
      return res.json();
    },
  });

  const categories: ProductCategory[] = categoriesData?.categories || [];
  const allTypes: ProductType[] = categories.flatMap(cat => 
    cat.types?.map(type => ({ ...type, categoryId: cat.id })) || []
  );

  // Filter types by selected category
  const filteredTypes = selectedCategoryFilter === 'all' 
    ? allTypes 
    : allTypes.filter(type => type.categoryId === selectedCategoryFilter);

  // Type mutations
  const typeMutation = useMutation({
    mutationFn: async (data: TypeFormData & { id?: string }) => {
      const url = data.id 
        ? `/api/spipuniform/admin/product-types/${data.id}`
        : '/api/spipuniform/admin/product-types';
      
      const res = await fetch(url, {
        method: data.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error('Failed to save product type');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spipuniform-categories'] });
      setIsDialogOpen(false);
      setEditingType(null);
      setFormData({ name: '', description: '', categoryId: '', isActive: true });
      toast.success(`Product type ${editingType ? 'updated' : 'created'} successfully`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (typeId: string) => {
      const res = await fetch(`/api/spipuniform/admin/product-types/${typeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete product type');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spipuniform-categories'] });
      toast.success('Product type deleted successfully');
    },
  });

  const toggleActiveTypeMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/spipuniform/admin/product-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed to update product type');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spipuniform-categories'] });
      toast.success('Product type status updated');
    },
  });

  const handleEdit = (type: ProductType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      categoryId: type.categoryId,
      isActive: type.isActive
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingType(null);
    setFormData({ 
      name: '', 
      description: '', 
      categoryId: selectedCategoryFilter !== 'all' ? selectedCategoryFilter : '',
      isActive: true 
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = editingType 
      ? { ...formData, id: editingType.id }
      : formData;
    typeMutation.mutate(data);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Unknown Category';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card text-card-foreground p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border bg-card text-card-foreground p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Package className="h-8 w-8" />
              Product Types
            </h1>
            <p className="text-muted-foreground">
              Define specific uniform items like "School Shirt", "Polo Shirt", "School Trousers" within each category.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
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
                    <Label htmlFor="categoryId">Category</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(cat => cat.isActive).map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. School Shirt"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this specific uniform item"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isActive">Active (available for listings)</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={typeMutation.isPending}>
                    {typeMutation.isPending ? 'Saving...' : (editingType ? 'Update' : 'Create')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategoryFilter('all')}
            >
              All Categories ({allTypes.length})
            </Button>
            {categories.map((category) => {
              const typeCount = allTypes.filter(type => type.categoryId === category.id).length;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategoryFilter === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategoryFilter(category.id)}
                >
                  {category.name} ({typeCount})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Product Types List */}
      <div className="grid gap-4">
        {filteredTypes.map((type) => (
          <Card key={type.id} className={!type.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{type.name}</CardTitle>
                    <Badge variant={type.isActive ? 'default' : 'secondary'}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>
                    {type.description || 'No description provided'}
                  </CardDescription>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tags className="h-3 w-3" />
                    <span>{getCategoryName(type.categoryId)}</span>
                    <span>•</span>
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">{type.slug}</code>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActiveTypeMutation.mutate({
                      id: type.id,
                      isActive: !type.isActive
                    })}
                    disabled={toggleActiveTypeMutation.isPending}
                  >
                    {type.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(type)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this product type? This will also affect all listings of this type.')) {
                        deleteTypeMutation.mutate(type.id);
                      }
                    }}
                    disabled={deleteTypeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {type.attributes && type.attributes.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Attributes ({type.attributes.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {type.attributes.map((attr) => (
                      <Badge key={attr.id} variant="secondary" className="text-xs">
                        {attr.name} ({attr.inputType})
                        {attr.required && <span className="ml-1 text-red-500">*</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        
        {filteredTypes.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {selectedCategoryFilter === 'all' 
                  ? 'No product types yet' 
                  : 'No product types in this category'
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {selectedCategoryFilter === 'all' 
                  ? 'Create your first product type to define specific uniform items.'
                  : 'Add product types to this category to define specific uniform items.'
                }
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Product Type
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}