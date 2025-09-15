import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Tags, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  ArrowUp, 
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/spipuniform/products/categories-old')({
  component: ProductCategoriesPage,
});

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  types: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }>;
}

interface CategoryFormData {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

function ProductCategoriesPage() {
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true
  });

  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['spipuniform-categories'],
    queryFn: async () => {
      const res = await fetch('/api/spipuniform/admin/categories');
      if (!res.ok) throw new Error('Failed to load categories');
      return res.json();
    },
  });

  const categories: ProductCategory[] = categoriesData?.categories || [];

  // Create/Update category mutation
  const categoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData & { id?: string }) => {
      const url = data.id 
        ? `/api/spipuniform/admin/categories/${data.id}`
        : '/api/spipuniform/admin/categories';
      
      const res = await fetch(url, {
        method: data.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error('Failed to save category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spipuniform-categories'] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', sortOrder: 0, isActive: true });
      toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await fetch(`/api/spipuniform/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spipuniform-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/spipuniform/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed to update category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spipuniform-categories'] });
      toast.success('Category status updated');
    },
  });

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      sortOrder: category.sortOrder,
      isActive: category.isActive
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', sortOrder: categories.length + 1, isActive: true });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = editingCategory 
      ? { ...formData, id: editingCategory.id }
      : formData;
    categoryMutation.mutate(data);
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
              <Tags className="h-8 w-8" />
              Product Categories
            </h1>
            <p className="text-muted-foreground">
              Organize your uniform products into categories like Shirts, Trousers, Accessories, etc.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Create Category'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory 
                      ? 'Update the category details below.'
                      : 'Create a new product category to organize uniform items.'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Shirts & Blouses"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of what products go in this category"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="sortOrder">Sort Order</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      min="1"
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
                    <Label htmlFor="isActive">Active (visible to users)</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={categoryMutation.isPending}>
                    {categoryMutation.isPending ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories List */}
      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id} className={!category.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      Order: {category.sortOrder}
                    </Badge>
                  </div>
                  <CardDescription>
                    {category.description || 'No description provided'}
                  </CardDescription>
                  <div className="text-sm text-muted-foreground">
                    Slug: <code className="bg-muted px-1 py-0.5 rounded">{category.slug}</code>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActiveMutation.mutate({
                      id: category.id,
                      isActive: !category.isActive
                    })}
                    disabled={toggleActiveMutation.isPending}
                  >
                    {category.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this category? This will also affect all product types in this category.')) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {category.types.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Product Types ({category.types.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {category.types.map((type) => (
                      <Badge key={type.id} variant="secondary">
                        {type.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        
        {categories.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Tags className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first product category to start organizing uniform items.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Category
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}