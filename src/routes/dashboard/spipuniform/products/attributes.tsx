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
import { Sliders, Plus, Edit, Trash2, Search, MoreHorizontal, Package, Tags, Eye, Settings, ArrowRightLeft, X } from 'lucide-react';
import { getSizeWithConversion } from '@/lib/conversions/shoe-sizes';

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
  { value: 'alpha_sizes', label: 'Alpha Sizes (XXS, XS, S, M, L, XL, XXL, XXXL)' },
  { value: 'numeric_sizes', label: 'Numeric Sizes (00, 0, 2, 4, 6, 8, 10, 12, 14, 16)' },
  { value: 'age_ranges', label: 'Age Ranges (3-4 years, 4-5 years, 5-6 years)' },
  { value: 'age_numeric', label: 'Numeric Ages (3, 4, 5, 6, 7, 8, 9, 10, etc.)' },
  { value: 'shoe_sizes_uk', label: 'UK Shoe Sizes (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)' },
  { value: 'shoe_sizes_eu', label: 'EU Shoe Sizes (33, 34, 35, 36, 37, 38, 39, 40)' },
  { value: 'waist_inseam', label: 'Waist x Inseam (28x30, 30x32, 32x34, 34x36)' },
  { value: 'neck_size', label: 'Neck Size (14.5", 15", 15.5", 16", 16.5", 17")' },
  { value: 'chest_size', label: 'Chest Size (36R, 38R, 40L, 42L, 44XL)' },
  { value: 'color_select', label: 'Color Options (Navy, White, Blue, Black)' },
  { value: 'gender_select', label: 'Gender (Boys, Girls, Unisex)' },
  { value: 'material_select', label: 'Material (Cotton, Polyester, Cotton/Poly Blend)' },
  { value: 'text_input', label: 'Text Input (Free text)' }
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
  
  const [initialValues, setInitialValues] = useState<Array<{value: string, displayName: string, sortOrder: number}>>([]);
  const [tempValue, setTempValue] = useState('');
  const [tempDisplayName, setTempDisplayName] = useState('');
  
  const addInitialValue = (value: string, displayName: string = '') => {
    const newValue = {
      value: value,
      displayName: displayName || value,
      sortOrder: initialValues.length
    };
    setInitialValues([...initialValues, newValue]);
  };
  
  const removeInitialValue = (index: number) => {
    setInitialValues(initialValues.filter((_, i) => i !== index));
  };
  
  const getPlaceholderForInputType = (inputType: string, field: 'value' | 'display'): string => {
    const placeholders: Record<string, { value: string; display: string }> = {
      'alpha_sizes': {
        value: 'e.g., XS, S, M, L, XL',
        display: 'e.g., Extra Small, Small, Medium'
      },
      'numeric_sizes': {
        value: 'e.g., 2, 4, 6, 8, 10',
        display: 'e.g., Size 2, Size 4'
      },
      'age_ranges': {
        value: 'e.g., 3-4',
        display: 'e.g., 3-4 years'
      },
      'age_numeric': {
        value: 'e.g., 3, 4, 5',
        display: 'e.g., 3 years, 4 years'
      },
      'shoe_sizes_uk': {
        value: 'e.g., 1, 2, 3, 4',
        display: 'e.g., UK 1, UK 2'
      },
      'shoe_sizes_eu': {
        value: 'e.g., 33, 34, 35, 36',
        display: 'e.g., EU 33, EU 34'
      },
      'waist_inseam': {
        value: 'e.g., 28x30, 30x32',
        display: 'e.g., 28W x 30L'
      },
      'neck_size': {
        value: 'e.g., 14.5, 15, 15.5',
        display: 'e.g., 14.5", 15"'
      },
      'chest_size': {
        value: 'e.g., 36R, 38R, 40L',
        display: 'e.g., 36" Regular'
      },
      'color_select': {
        value: 'e.g., navy, white',
        display: 'e.g., Navy, White'
      },
      'gender_select': {
        value: 'e.g., boys, girls',
        display: 'e.g., Boys, Girls'
      },
      'material_select': {
        value: 'e.g., cotton, polyester',
        display: 'e.g., Cotton, Polyester'
      },
      'text_input': {
        value: 'e.g., custom text',
        display: 'e.g., Custom Value'
      }
    };
    
    return placeholders[inputType]?.[field] || 'Enter value';
  };
  
  const handleAddValue = () => {
    if (!tempValue.trim()) return;
    addInitialValue(tempValue.trim(), tempDisplayName.trim() || tempValue.trim());
    setTempValue('');
    setTempDisplayName('');
  };

  const updateInitialAgeRange = (value: string, type: 'from' | 'to') => {
    const currentValue = tempValue;
    const parts = currentValue.split('-');
    if (type === 'from') {
      const newValue = `${value}-${parts[1] || ''}`;
      setTempValue(newValue);
      setTempDisplayName(parts[1] ? `${value}-${parts[1]} years` : '');
    } else {
      const newValue = `${parts[0] || ''}-${value}`;
      setTempValue(newValue);
      setTempDisplayName(parts[0] ? `${parts[0]}-${value} years` : '');
    }
  };

  const updateInitialWaistInseam = (value: string, type: 'waist' | 'inseam') => {
    const currentValue = tempValue;
    const parts = currentValue.split('x');
    if (type === 'waist') {
      const newValue = `${value}x${parts[1] || ''}`;
      setTempValue(newValue);
      setTempDisplayName(parts[1] ? `${value}x${parts[1]}` : '');
    } else {
      const newValue = `${parts[0] || ''}x${value}`;
      setTempValue(newValue);
      setTempDisplayName(parts[0] ? `${parts[0]}x${value}` : '');
    }
  };

  const renderInitialValueFields = () => {
    const inputType = formData.inputType;
    switch (inputType) {
      case 'age_ranges':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="temp-age-from" className="text-xs">From Age</Label>
                <Input
                  id="temp-age-from"
                  type="number"
                  value={tempValue.split('-')[0] || ''}
                  onChange={(e) => updateInitialAgeRange(e.target.value, 'from')}
                  placeholder="3"
                  className="h-8"
                  min="0"
                  max="18"
                />
              </div>
              <div>
                <Label htmlFor="temp-age-to" className="text-xs">To Age</Label>
                <Input
                  id="temp-age-to"
                  type="number"
                  value={tempValue.split('-')[1] || ''}
                  onChange={(e) => updateInitialAgeRange(e.target.value, 'to')}
                  placeholder="4"
                  className="h-8"
                  min="0"
                  max="18"
                />
              </div>
            </div>
            <Input
              value={tempDisplayName}
              onChange={(e) => setTempDisplayName(e.target.value)}
              placeholder="e.g., 3-4 years"
              className="h-8 mt-2"
            />
          </>
        );
      
      case 'waist_inseam':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="temp-waist" className="text-xs">Waist</Label>
                <Input
                  id="temp-waist"
                  type="number"
                  value={tempValue.split('x')[0] || ''}
                  onChange={(e) => updateInitialWaistInseam(e.target.value, 'waist')}
                  placeholder="28"
                  className="h-8"
                  min="24"
                  max="50"
                />
              </div>
              <div>
                <Label htmlFor="temp-inseam" className="text-xs">Inseam</Label>
                <Input
                  id="temp-inseam"
                  type="number"
                  value={tempValue.split('x')[1] || ''}
                  onChange={(e) => updateInitialWaistInseam(e.target.value, 'inseam')}
                  placeholder="30"
                  className="h-8"
                  min="26"
                  max="38"
                />
              </div>
            </div>
            <Input
              value={tempDisplayName}
              onChange={(e) => setTempDisplayName(e.target.value)}
              placeholder="e.g., 28W x 30L"
              className="h-8 mt-2"
            />
          </>
        );
      
      case 'alpha_sizes':
        return (
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value.toUpperCase())}
            placeholder="e.g., XS, S, M, L, XL"
            className="h-8"
          />
        );
      
      case 'numeric_sizes':
      case 'age_numeric':
      case 'shoe_sizes_uk':
      case 'shoe_sizes_eu':
        return (
          <Input
            type="number"
            step={inputType.includes('shoe') ? '0.5' : '1'}
            value={tempValue}
            onChange={(e) => {
              setTempValue(e.target.value);
              setTempDisplayName(e.target.value ? `Size ${e.target.value}` : '');
            }}
            placeholder={getPlaceholderForInputType(inputType, 'value')}
            className="h-8"
            min="0"
          />
        );
      
      case 'neck_size':
      case 'chest_size':
        return (
          <Input
            type="text"
            step="0.5"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder={getPlaceholderForInputType(inputType, 'value')}
            className="h-8"
          />
        );
      
      case 'color_select':
      case 'gender_select':
      case 'material_select':
        return (
          <Input
            value={tempValue}
            onChange={(e) => {
              setTempValue(e.target.value.toLowerCase().replace(/\s+/g, '_'));
              setTempDisplayName(e.target.value);
            }}
            placeholder={getPlaceholderForInputType(inputType, 'display')}
            className="h-8"
          />
        );
      
      default:
        return (
          <>
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={getPlaceholderForInputType(inputType, 'value')}
              className="h-8"
            />
            <Input
              value={tempDisplayName}
              onChange={(e) => setTempDisplayName(e.target.value)}
              placeholder={getPlaceholderForInputType(inputType, 'display')}
              className="h-8 mt-2"
            />
          </>
        );
    }
  };
  
  const resetFormState = () => {
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
    setInitialValues([]);
    setTempValue('');
    setTempDisplayName('');
    setEditingAttribute(null);
  };
  
  const handleCreate = () => {
    resetFormState();
    setIsDialogOpen(true);
  };
  
  const handleEdit = (attribute: Attribute) => {
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
    setEditingAttribute(attribute);
    // Don't pre-populate initial values when editing
    setInitialValues([]);
    setTempValue('');
    setTempDisplayName('');
    setIsDialogOpen(true);
  };
  
  
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
        // If creating a new attribute and there are initial values, create them
        if (!editingAttribute && initialValues.length > 0) {
          for (const value of initialValues) {
            try {
              await fetch('/api/spipuniform/admin/attribute-values/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  attributeId: data.attribute.id,
                  value: value.value,
                  displayName: value.displayName,
                  sortOrder: value.sortOrder
                }),
              });
            } catch (valueError) {
              console.error('Error creating attribute value:', valueError);
            }
          }
        }
        
        const successMessage = editingAttribute 
          ? 'Attribute updated successfully' 
          : `Attribute created successfully${initialValues.length > 0 ? ` with ${initialValues.length} initial values` : ''}`;
        
        toast.success(successMessage);
        setIsDialogOpen(false);
        resetFormState();
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
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          resetFormState();
        }
      }}>
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
            
            {/* Dynamic Value Input Section */}
            {formData.inputType && !editingAttribute && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Initial Values</h4>
                  <span className="text-xs text-muted-foreground">
                    Add some initial values for this attribute
                  </span>
                </div>
                
                {/* Display existing values */}
                {initialValues.length > 0 && (
                  <div className="space-y-2">
                    {initialValues.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/30 rounded-md p-2">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{item.displayName}</span>
                          {item.value !== item.displayName && (
                            <span className="text-xs text-muted-foreground ml-2">({item.value})</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInitialValue(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new value form */}
                <div className="space-y-3">
                  {renderInitialValueFields()}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddValue}
                    disabled={
                      formData.inputType === 'age_ranges'
                        ? !tempValue.split('-').every(part => part.trim())
                        : formData.inputType === 'waist_inseam'
                        ? !tempValue.split('x').every(part => part.trim())
                        : !tempValue.trim()
                    }
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Value
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setIsDialogOpen(false);
              resetFormState();
            }}>
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

  const getSizeConversionDisplay = (value: AttributeValue) => {
    const numericValue = parseFloat(value.value);
    if (isNaN(numericValue)) return null;
    
    if (attribute.inputType === 'shoe_sizes_eu') {
      return getSizeWithConversion(numericValue, 'EU');
    } else if (attribute.inputType === 'shoe_sizes_uk') {
      return getSizeWithConversion(numericValue, 'UK');
    }
    return null;
  };

  const renderValueInputFields = () => {
    const inputType = attribute.inputType;
    switch (inputType) {
      case 'age_ranges':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ageFrom">From Age *</Label>
                <Input
                  id="ageFrom"
                  type="number"
                  placeholder="e.g. 3"
                  min="0"
                  max="18"
                  value={formData.value.split('-')[0] || ''}
                  onChange={(e) => updateAgeRange(e.target.value, 'from')}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ageTo">To Age *</Label>
                <Input
                  id="ageTo"
                  type="number"
                  placeholder="e.g. 4"
                  min="0"
                  max="18"
                  value={formData.value.split('-')[1] || ''}
                  onChange={(e) => updateAgeRange(e.target.value, 'to')}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. 3-4 years"
                required
              />
            </div>
          </>
        );
      
      case 'waist_inseam':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="waistSize">Waist Size *</Label>
                <Input
                  id="waistSize"
                  type="number"
                  placeholder="e.g. 32"
                  min="24"
                  max="50"
                  value={formData.value.split('x')[0] || ''}
                  onChange={(e) => updateWaistInseam(e.target.value, 'waist')}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inseamLength">Inseam Length *</Label>
                <Input
                  id="inseamLength"
                  type="number"
                  placeholder="e.g. 30"
                  min="26"
                  max="38"
                  value={formData.value.split('x')[1] || ''}
                  onChange={(e) => updateWaistInseam(e.target.value, 'inseam')}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. 32W x 30L"
                required
              />
            </div>
          </>
        );
      
      case 'shoe_sizes_eu':
      case 'shoe_sizes_uk':
        const sizeType = inputType === 'shoe_sizes_eu' ? 'EU' : 'UK';
        const minSize = sizeType === 'EU' ? 33 : 1;
        const maxSize = sizeType === 'EU' ? 50 : 14;
        const placeholder = sizeType === 'EU' ? 'e.g. 38' : 'e.g. 5';
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="shoeSize">{sizeType} Shoe Size *</Label>
              <Input
                id="shoeSize"
                type="number"
                step="0.5"
                placeholder={placeholder}
                min={minSize}
                max={maxSize}
                value={formData.value}
                onChange={(e) => {
                  const size = parseFloat(e.target.value);
                  setFormData({
                    ...formData,
                    value: e.target.value,
                    displayName: e.target.value ? `${sizeType} ${e.target.value}` : ''
                  });
                }}
                required
              />
              {formData.value && (
                <p className="text-sm text-muted-foreground">
                  Conversion: {getSizeWithConversion(parseFloat(formData.value), sizeType)}
                </p>
              )}
            </div>
          </>
        );
      
      case 'alpha_sizes':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="alphaSize">Alpha Size *</Label>
              <Input
                id="alphaSize"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value.toUpperCase(), displayName: e.target.value })}
                placeholder="e.g., XS, S, M, L, XL, XXL"
                required
              />
            </div>
          </>
        );
      
      case 'numeric_sizes':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="numericSize">Numeric Size *</Label>
              <Input
                id="numericSize"
                type="number"
                step="1"
                placeholder="e.g. 2, 4, 6, 8, 10, 12"
                min="0"
                max="30"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value, displayName: `Size ${e.target.value}` })}
                required
              />
            </div>
          </>
        );
      
      case 'age_numeric':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                placeholder="e.g. 3, 4, 5, 6"
                min="0"
                max="18"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value, displayName: `${e.target.value} years` })}
                required
              />
            </div>
          </>
        );

      case 'neck_size':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="neckSize">Neck Size *</Label>
              <Input
                id="neckSize"
                type="number"
                step="0.5"
                placeholder="e.g. 14.5, 15, 15.5"
                min="13"
                max="20"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value, displayName: `${e.target.value}"` })}
                required
              />
            </div>
          </>
        );

      case 'chest_size':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="chestSize">Chest Size *</Label>
              <Input
                id="chestSize"
                type="text"
                placeholder="e.g. 36R, 38R, 40L, 42XL"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value, displayName: e.target.value })}
                required
              />
            </div>
          </>
        );
      
      case 'color_select':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="colorName">Color Name *</Label>
              <Input
                id="colorName"
                placeholder="e.g. Navy, White, Blue"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                required
              />
            </div>
          </>
        );

      case 'gender_select':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.value} onValueChange={(value) => {
                const displayNames = { boys: 'Boys', girls: 'Girls', unisex: 'Unisex' };
                setFormData({...formData, value, displayName: displayNames[value as keyof typeof displayNames] || value});
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                  <SelectItem value="unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'material_select':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="material">Material *</Label>
              <Input
                id="material"
                placeholder="e.g. Cotton, Polyester, Blend"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                required
              />
            </div>
          </>
        );
      
      case 'text_input':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="textValue">Value *</Label>
              <Input
                id="textValue"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value, displayName: e.target.value })}
                placeholder="e.g. Custom text input"
                required
              />
            </div>
          </>
        );

      default:
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Custom Option"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="e.g. custom_value"
                required
              />
            </div>
          </>
        );
    }
  };

  const updateAgeRange = (value: string, type: 'from' | 'to') => {
    const currentValue = formData.value;
    const parts = currentValue.split('-');
    if (type === 'from') {
      const newValue = `${value}-${parts[1] || ''}`;
      const newDisplay = parts[1] ? `${value}-${parts[1]} years` : value;
      setFormData({
        ...formData,
        value: newValue,
        displayName: formData.displayName || newDisplay
      });
    } else {
      const newValue = `${parts[0] || ''}-${value}`;
      const newDisplay = parts[0] ? `${parts[0]}-${value} years` : value;
      setFormData({
        ...formData,
        value: newValue,
        displayName: formData.displayName || newDisplay
      });
    }
  };

  const updateWaistInseam = (value: string, type: 'waist' | 'inseam') => {
    const currentValue = formData.value;
    const parts = currentValue.split('x');
    if (type === 'waist') {
      const newValue = `${value}x${parts[1] || ''}`;
      const newDisplay = parts[1] ? `${value}W x ${parts[1]}L` : value;
      setFormData({
        ...formData,
        value: newValue,
        displayName: formData.displayName || newDisplay
      });
    } else {
      const newValue = `${parts[0] || ''}x${value}`;
      const newDisplay = parts[0] ? `${parts[0]}W x ${value}L` : value;
      setFormData({
        ...formData,
        value: newValue,
        displayName: formData.displayName || newDisplay
      });
    }
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
              {(attribute.inputType === 'shoe_sizes_eu' || attribute.inputType === 'shoe_sizes_uk') && (
                <TableHead>Size Conversion</TableHead>
              )}
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {values.map((value) => {
              const sizeConversion = getSizeConversionDisplay(value);
              return (
                <TableRow key={value.id}>
                  <TableCell className="font-medium">{value.displayName}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm">{value.value}</code>
                  </TableCell>
                  {(attribute.inputType === 'shoe_sizes_eu' || attribute.inputType === 'shoe_sizes_uk') && (
                    <TableCell>
                      {sizeConversion ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ArrowRightLeft className="h-3 w-3" />
                          {sizeConversion}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  )}
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
            );
          })}
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
            {renderValueInputFields()}
            
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