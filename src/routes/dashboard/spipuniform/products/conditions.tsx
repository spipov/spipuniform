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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, MoreHorizontal, CheckCircle, XCircle, Star, Move, GripVertical } from 'lucide-react';

interface Condition {
  id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const Route = createFileRoute('/dashboard/spipuniform/products/conditions')({
  component: ProductConditionsPage,
});

function ProductConditionsPage() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<Condition | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0,
    isActive: true
  });
  
  const filteredConditions = conditions.filter(condition =>
    condition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (condition.description && condition.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchConditions = async () => {
    try {
      const response = await fetch('/api/spipuniform/admin/conditions/');
      const data = await response.json();
      
      if (data.success) {
        setConditions(data.conditions || []);
      } else {
        toast.error('Failed to load conditions');
      }
    } catch (error) {
      console.error('Error fetching conditions:', error);
      toast.error('Failed to load conditions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, []);

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Please enter a condition name');
        return;
      }

      const url = editingCondition 
        ? `/api/spipuniform/admin/conditions/${editingCondition.id}`
        : '/api/spipuniform/admin/conditions/';
      
      const method = editingCondition ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingCondition ? 'Condition updated successfully' : 'Condition created successfully');
        setIsDialogOpen(false);
        setEditingCondition(null);
        setFormData({ name: '', description: '', order: 0, isActive: true });
        fetchConditions();
      } else {
        toast.error(data.error || 'Failed to save condition');
      }
    } catch (error) {
      console.error('Error saving condition:', error);
      toast.error('Failed to save condition');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this condition? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/spipuniform/admin/conditions/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Condition deleted successfully');
        fetchConditions();
      } else {
        toast.error(data.error || 'Failed to delete condition');
      }
    } catch (error) {
      console.error('Error deleting condition:', error);
      toast.error('Failed to delete condition');
    }
  };

  const toggleActive = async (condition: Condition) => {
    try {
      const response = await fetch(`/api/spipuniform/admin/conditions/${condition.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: condition.name,
          description: condition.description,
          order: condition.order,
          isActive: !condition.isActive 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Condition ${!condition.isActive ? 'activated' : 'deactivated'}`);
        fetchConditions();
      } else {
        toast.error(data.error || 'Failed to update condition');
      }
    } catch (error) {
      console.error('Error toggling condition status:', error);
      toast.error('Failed to update condition');
    }
  };

  const handleEdit = (condition: Condition) => {
    setEditingCondition(condition);
    setFormData({
      name: condition.name,
      description: condition.description || '',
      order: condition.order,
      isActive: condition.isActive
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCondition(null);
    setFormData({ 
      name: '', 
      description: '', 
      order: conditions.length, 
      isActive: true 
    });
    setIsDialogOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, conditionId: string) => {
    setDraggedItem(conditionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetConditionId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetConditionId) {
      setDraggedItem(null);
      return;
    }

    const draggedCondition = conditions.find(c => c.id === draggedItem);
    const targetCondition = conditions.find(c => c.id === targetConditionId);
    
    if (!draggedCondition || !targetCondition) {
      setDraggedItem(null);
      return;
    }

    // Optimistic update
    const newConditions = [...conditions];
    const draggedIndex = newConditions.findIndex(c => c.id === draggedItem);
    const targetIndex = newConditions.findIndex(c => c.id === targetConditionId);
    
    // Remove dragged item and insert at new position
    newConditions.splice(draggedIndex, 1);
    newConditions.splice(targetIndex, 0, draggedCondition);
    
    // Update order values
    const conditionOrders = newConditions.map((condition, index) => ({
      id: condition.id,
      order: index
    }));

    setConditions(newConditions);
    setDraggedItem(null);

    // Send to server
    try {
      const response = await fetch('/api/spipuniform/admin/conditions/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conditionOrders })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Conditions reordered successfully');
        fetchConditions(); // Refresh to get server state
      } else {
        toast.error(data.error || 'Failed to reorder conditions');
        fetchConditions(); // Revert to server state
      }
    } catch (error) {
      console.error('Error reordering conditions:', error);
      toast.error('Failed to reorder conditions');
      fetchConditions(); // Revert to server state
    }
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
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Star className="h-8 w-8" />
            Condition Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage uniform condition levels for accurate listing descriptions
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Condition
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uniform Conditions</CardTitle>
          <CardDescription>
            Define condition levels that sellers can use to describe their uniform items.
            Drag and drop to reorder conditions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search conditions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {filteredConditions.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No conditions found</h3>
                  <p className="text-muted-foreground">
                    {conditions.length === 0
                      ? 'Create your first condition to get started.'
                      : 'Try adjusting your search terms.'
                    }
                  </p>
                  {conditions.length === 0 && (
                    <Button onClick={handleCreate} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Condition
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConditions.map((condition) => (
                        <TableRow 
                          key={condition.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, condition.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, condition.id)}
                          className={`cursor-move ${draggedItem === condition.id ? 'opacity-50' : ''}`}
                        >
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell className="font-medium">{condition.name}</TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">
                            {condition.description || '-'}
                          </TableCell>
                          <TableCell>{condition.order}</TableCell>
                          <TableCell>
                            {condition.isActive ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(condition.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(condition)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleActive(condition)}>
                                  {condition.isActive ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(condition.id)}
                                  className="text-red-600"
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
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCondition ? 'Edit Condition' : 'Create Condition'}
            </DialogTitle>
            <DialogDescription>
              {editingCondition 
                ? 'Update the condition details below.'
                : 'Create a new condition level for uniform listings.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Excellent"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Detailed description of this condition level"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                min="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="isActive">Active condition</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingCondition ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}