import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Package, Euro, Target } from 'lucide-react';

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
    productTypeId: '',
    size: '',
    conditionPreference: '',
    description: '',
    maxPrice: ''
  });

  // Fetch filter options
  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const response = await fetch('/api/product-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.categories;
    }
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
      setFormData({ productTypeId: '', size: '', conditionPreference: '', description: '', maxPrice: '' });
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
      maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined
    };

    createRequestMutation.mutate(requestData);
  };

  const handleClose = () => {
    setFormData({ productTypeId: '', size: '', conditionPreference: '', description: '', maxPrice: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Create a Request
          </DialogTitle>
          <DialogDescription>
            Let other parents know what uniform items you're looking for from {schoolName}
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
              <Label htmlFor="productType">Product Type *</Label>
              <Select
                value={formData.productTypeId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, productTypeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select what you're looking for" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category: any) =>
                    category.productTypes?.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>
                        {category.name} - {type.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                placeholder="e.g., Age 7-8, Size 10, Medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">Preferred Condition</Label>
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
                      {condition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2 text-green-800">
              <Search className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">What happens next?</p>
                <p className="text-green-700">
                  Your request will be visible to other parents. When someone has a matching item,
                  they'll be able to contact you directly. You'll also get notified if new listings
                  match your request.
                </p>
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
            {createRequestMutation.isPending ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}