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
import { Sliders, Plus, Edit, Trash2, Search, MoreHorizontal, Package, Tags, Eye, Settings } from 'lucide-react';

export const Route = createFileRoute('/dashboard/spipuniform/products/attributes')({
  component: AttributesPage,
});

interface ProductType {
  id: string;
  name: string;
  slug: string;
  categoryName?: string;
}

interface Attribute {
  id: string;
  productTypeId: string;
  name: string;
  slug: string;
  inputType: string;
  required: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  createdAt?: string;
  updatedAt?: string;
  productTypeName?: string;
  categoryName?: string;
  valuesCount: number;
  values: AttributeValue[];
}

interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
}

const INPUT_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'number', label: 'Number Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' }
];

function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string>('all');
  const [formData, setFormData] = useState({
    productTypeId: '',
    name: '',
    slug: '',
    inputType: '',
    required: false,
    order: 0,
    placeholder: '',
    helpText: ''
  });
  
  const filteredAttributes = attributes.filter(attribute => {
    const matchesSearch = attribute.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attribute.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attribute.productTypeName && attribute.productTypeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (attribute.categoryName && attribute.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProductType = selectedProductType === 'all' || attribute.productTypeId === selectedProductType;
    
    return matchesSearch && matchesProductType;
  });

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
    }
  };

  const fetchAttributes = async () => {
    try {
      const response = await fetch('/api/spipuniform/admin/attributes/');
      const data = await response.json();
      
      if (data.success) {
        setAttributes(data.attributes || []);
      } else {
        toast.error('Failed to load attributes');
      }
    } catch (error) {
      console.error('Error fetching attributes:', error);
      toast.error('Failed to load attributes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchProductTypes(), fetchAttributes()]);
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
      if (!formData.productTypeId || !formData.name || !formData.slug || !formData.inputType) {
        toast.error('Please fill in all required fields');
        return;
      }

      const url = editingAttribute 
        ? `/api/spipuniform/admin/attributes/${editingAttribute.id}`
        : '/api/spipuniform/admin/attributes/';
      
      const method = editingAttribute ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingAttribute ? 'Attribute updated successfully' : 'Attribute created successfully');
        setIsDialogOpen(false);
        setEditingAttribute(null);
        setFormData({ 
          productTypeId: '', 
          name: '', 
          slug: '', 
          inputType: '', 
          required: false, 
          order: 0, 
          placeholder: '', 
          helpText: '' 
        });
        fetchAttributes();
      } else {
        toast.error(data.error || 'Failed to save attribute');
      }
    } catch (error) {
      console.error('Error saving attribute:', error);
      toast.error('Failed to save attribute');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attribute? This will also delete all associated values.')) return;
    
    try {
      const response = await fetch(`/api/spipuniform/admin/attributes/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Attribute deleted successfully');
        fetchAttributes();
      } else {
        toast.error(data.error || 'Failed to delete attribute');
      }
    } catch (error) {
      console.error('Error deleting attribute:', error);
      toast.error('Failed to delete attribute');
    }
  };

  const handleEdit = (attribute: Attribute) => {
    setEditingAttribute(attribute);
    setFormData({
      productTypeId: attribute.productTypeId,
      name: attribute.name,
      slug: attribute.slug,
      inputType: attribute.inputType,
      required: attribute.required,
      order: attribute.order,
      placeholder: attribute.placeholder || '',
      helpText: attribute.helpText || ''
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingAttribute(null);
    setFormData({ 
      productTypeId: selectedProductType !== 'all' ? selectedProductType : '',
      name: '', 
      slug: '', 
      inputType: '', 
      required: false, 
      order: attributes.length + 1, 
      placeholder: '', 
      helpText: '' 
    });
    setIsDialogOpen(true);
  };

  const handleManageValues = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setIsValueDialogOpen(true);
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

  const getInputTypeLabel = (inputType: string) => {
    const type = INPUT_TYPES.find(t => t.value === inputType);
    return type ? type.label : inputType;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-6 w-6" />
                Product Attributes
              </CardTitle>
              <CardDescription>
                Manage attributes that can be assigned to product types (e.g., Size, Color, Age) ({attributes.length} total)
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Attribute
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attributes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedProductType} onValueChange={setSelectedProductType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by product type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Product Types</SelectItem>
                {productTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} ({type.categoryName})
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
                    <TableHead>Product Type</TableHead>
                    <TableHead>Input Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Values</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttributes.map((attribute) => (
                    <TableRow key={attribute.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{attribute.name}</div>
                          <code className="text-xs text-muted-foreground">{attribute.slug}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{attribute.productTypeName}</div>
                            <div className="text-xs text-muted-foreground">{attribute.categoryName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getInputTypeLabel(attribute.inputType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={attribute.required ? 'destructive' : 'secondary'}>
                          {attribute.required ? 'Required' : 'Optional'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageValues(attribute)}
                          className="gap-2"
                        >
                          <Settings className="h-3 w-3" />
                          {attribute.valuesCount} values
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{attribute.order}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(attribute.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(attribute)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageValues(attribute)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Manage Values
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(attribute.id)}
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

              {filteredAttributes.length === 0 && (
                <div className="text-center py-8">
                  <Sliders className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    {attributes.length === 0 ? 'No attributes yet' : 'No matching attributes'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {attributes.length === 0 
                      ? 'Create your first attribute to define properties for product types.'
                      : 'Try adjusting your search terms or product type filter.'
                    }
                  </p>
                  {attributes.length === 0 && (
                    <Button onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Attribute
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Attribute Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAttribute ? 'Edit Attribute' : 'Create Attribute'}
            </DialogTitle>
            <DialogDescription>
              {editingAttribute 
                ? 'Update the attribute details below.'
                : 'Create a new attribute that can be assigned to product types.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="productTypeId">Product Type *</Label>
              <Select value={formData.productTypeId} onValueChange={(value) => setFormData({...formData, productTypeId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product type" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.categoryName})
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
                placeholder="e.g. Size"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. size"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="inputType">Input Type *</Label>
              <Select value={formData.inputType} onValueChange={(value) => setFormData({...formData, inputType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select input type" />
                </SelectTrigger>
                <SelectContent>
                  {INPUT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="required">Required field</Label>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="placeholder">Placeholder Text</Label>
              <Input
                id="placeholder"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="e.g. Select your size"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="helpText">Help Text</Label>
              <Textarea
                id="helpText"
                value={formData.helpText}
                onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
                placeholder="Additional guidance for users"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingAttribute ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Attribute Values Dialog */}
      {selectedAttribute && (
        <Dialog open={isValueDialogOpen} onOpenChange={setIsValueDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Manage Values for "{selectedAttribute.name}"</DialogTitle>
              <DialogDescription>
                Add and manage the possible values for this attribute (e.g., Small, Medium, Large for Size)
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <AttributeValuesManager 
                attribute={selectedAttribute} 
                onUpdate={() => {
                  fetchAttributes();
                  setSelectedAttribute({...selectedAttribute});
                }}
              />
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsValueDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Separate component for managing attribute values
function AttributeValuesManager({ attribute, onUpdate }: { attribute: Attribute; onUpdate: () => void }) {
  const [values, setValues] = useState<AttributeValue[]>(attribute.values || []);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [formData, setFormData] = useState({
    value: '',
    displayName: '',
    sortOrder: 0,
    isActive: true
  });

  const fetchValues = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/spipuniform/admin/attribute-values/?attributeId=${attribute.id}`);
      const data = await response.json();
      
      if (data.success) {
        setValues(data.attributeValues || []);
      } else {
        toast.error('Failed to load attribute values');
      }
    } catch (error) {
      console.error('Error fetching attribute values:', error);
      toast.error('Failed to load attribute values');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValues();
  }, [attribute.id]);

  const handleSubmitValue = async () => {
    try {
      if (!formData.value || !formData.displayName) {
        toast.error('Please fill in value and display name');
        return;
      }

      const url = editingValue 
        ? `/api/spipuniform/admin/attribute-values/${editingValue.id}`
        : '/api/spipuniform/admin/attribute-values/';
      
      const method = editingValue ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          attributeId: attribute.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingValue ? 'Value updated successfully' : 'Value created successfully');
        setIsAddDialogOpen(false);
        setEditingValue(null);
        setFormData({ value: '', displayName: '', sortOrder: 0, isActive: true });
        fetchValues();
        onUpdate();
      } else {
        toast.error(data.error || 'Failed to save value');
      }
    } catch (error) {
      console.error('Error saving value:', error);
      toast.error('Failed to save value');
    }
  };

  const handleDeleteValue = async (id: string) => {
    if (!confirm('Are you sure you want to delete this value?')) return;
    
    try {
      const response = await fetch(`/api/spipuniform/admin/attribute-values/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Value deleted successfully');
        fetchValues();
        onUpdate();
      } else {
        toast.error(data.error || 'Failed to delete value');
      }
    } catch (error) {
      console.error('Error deleting value:', error);
      toast.error('Failed to delete value');
    }
  };

  const handleEditValue = (value: AttributeValue) => {
    setEditingValue(value);
    setFormData({
      value: value.value,
      displayName: value.displayName,
      sortOrder: value.sortOrder,
      isActive: value.isActive
    });
    setIsAddDialogOpen(true);
  };

  const handleAddValue = () => {
    setEditingValue(null);
    setFormData({ 
      value: '', 
      displayName: '', 
      sortOrder: values.length + 1, 
      isActive: true 
    });
    setIsAddDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Values ({values.length})</h4>
        <Button size="sm" onClick={handleAddValue}>
          <Plus className="mr-2 h-3 w-3" />
          Add Value
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {values.map((value) => (
              <TableRow key={value.id}>
                <TableCell className="font-medium">{value.displayName}</TableCell>
                <TableCell>
                  <code className="bg-muted px-2 py-1 rounded text-sm">{value.value}</code>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{value.sortOrder}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={value.isActive ? 'default' : 'secondary'}>
                    {value.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditValue(value)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteValue(value.id)}
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
      )}

      {values.length === 0 && !loading && (
        <div className="text-center py-6 border rounded-lg">
          <p className="text-muted-foreground mb-2">No values defined for this attribute</p>
          <Button size="sm" onClick={handleAddValue}>
            <Plus className="mr-2 h-3 w-3" />
            Add First Value
          </Button>
        </div>
      )}

      {/* Add/Edit Value Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingValue ? 'Edit Value' : 'Add Value'}
            </DialogTitle>
            <DialogDescription>
              Define a possible value for the "{attribute.name}" attribute
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Extra Small"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="e.g. xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitValue}>
              {editingValue ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}