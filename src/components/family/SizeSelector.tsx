import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Info } from 'lucide-react';

// Size category types based on the product attribute system
export type SizeInputType = 
  | 'alpha_sizes'        // XS, S, M, L, XL
  | 'numeric_sizes'      // 6, 8, 10, 12, 14
  | 'age_ranges'         // Age 3-4, Age 5-6, Age 7-8
  | 'age_numeric'        // 3, 4, 5, 6, 7
  | 'shoe_sizes_uk'      // UK 8, UK 9, UK 10
  | 'shoe_sizes_eu'      // EU 26, EU 27, EU 28
  | 'waist_inseam'       // 28x30, 30x32
  | 'neck_size'          // 14", 14.5", 15"
  | 'chest_size'         // 32" Regular, 34" Slim
  | 'text_input';        // Free text

// Size category definitions
export interface SizeCategory {
  id: string;
  name: string;
  inputType: SizeInputType;
  description?: string;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

// Comprehensive size categories for uniforms
export const UNIFORM_SIZE_CATEGORIES: SizeCategory[] = [
  {
    id: 'shirt',
    name: 'Shirt/Blouse',
    inputType: 'age_ranges',
    description: 'School shirts, blouses, and polo shirts',
    options: ['Age 3-4', 'Age 4-5', 'Age 5-6', 'Age 6-7', 'Age 7-8', 'Age 8-9', 'Age 9-10', 'Age 10-11', 'Age 11-12', 'Age 12-13', 'Age 13-14', 'Age 14-15', 'Age 15-16'],
    helpText: 'Choose the age range that best fits your child'
  },
  {
    id: 'trousers',
    name: 'Trousers/Shorts',
    inputType: 'age_ranges',
    description: 'School trousers, shorts, and skirts',
    options: ['Age 3-4', 'Age 4-5', 'Age 5-6', 'Age 6-7', 'Age 7-8', 'Age 8-9', 'Age 9-10', 'Age 10-11', 'Age 11-12', 'Age 12-13', 'Age 13-14', 'Age 14-15', 'Age 15-16'],
    helpText: 'Size may run differently from shirts - check measurements'
  },
  {
    id: 'skirt',
    name: 'Skirt/Pinafore',
    inputType: 'age_ranges',
    description: 'School skirts and pinafores',
    options: ['Age 3-4', 'Age 4-5', 'Age 5-6', 'Age 6-7', 'Age 7-8', 'Age 8-9', 'Age 9-10', 'Age 10-11', 'Age 11-12', 'Age 12-13', 'Age 13-14', 'Age 14-15', 'Age 15-16']
  },
  {
    id: 'shoes',
    name: 'School Shoes',
    inputType: 'shoe_sizes_uk',
    description: 'Black school shoes, boots, and formal footwear',
    options: [
      'UK 4 (Child)', 'UK 5 (Child)', 'UK 6 (Child)', 'UK 7 (Child)', 'UK 8 (Child)', 'UK 9 (Child)', 
      'UK 10 (Child)', 'UK 11 (Child)', 'UK 12 (Child)', 'UK 13 (Child)',
      'UK 1', 'UK 1.5', 'UK 2', 'UK 2.5', 'UK 3', 'UK 3.5', 'UK 4', 'UK 4.5', 'UK 5', 'UK 5.5', 'UK 6', 'UK 6.5', 'UK 7', 'UK 7.5', 'UK 8'
    ],
    helpText: 'UK shoe sizes - check current fit regularly as feet grow quickly'
  },
  {
    id: 'pe_shoes',
    name: 'PE/Sports Shoes',
    inputType: 'shoe_sizes_uk',
    description: 'Runners, football boots, and sports footwear',
    options: [
      'UK 4 (Child)', 'UK 5 (Child)', 'UK 6 (Child)', 'UK 7 (Child)', 'UK 8 (Child)', 'UK 9 (Child)', 
      'UK 10 (Child)', 'UK 11 (Child)', 'UK 12 (Child)', 'UK 13 (Child)',
      'UK 1', 'UK 1.5', 'UK 2', 'UK 2.5', 'UK 3', 'UK 3.5', 'UK 4', 'UK 4.5', 'UK 5', 'UK 5.5', 'UK 6', 'UK 6.5', 'UK 7', 'UK 7.5', 'UK 8'
    ]
  },
  {
    id: 'jumper',
    name: 'Jumper/Cardigan',
    inputType: 'age_ranges',
    description: 'School jumpers, cardigans, and knitwear',
    options: ['Age 3-4', 'Age 4-5', 'Age 5-6', 'Age 6-7', 'Age 7-8', 'Age 8-9', 'Age 9-10', 'Age 10-11', 'Age 11-12', 'Age 12-13', 'Age 13-14', 'Age 14-15', 'Age 15-16'],
    helpText: 'Often runs larger than shirt sizes for layering'
  },
  {
    id: 'blazer',
    name: 'Blazer/Jacket',
    inputType: 'age_ranges',
    description: 'School blazers and formal jackets',
    options: ['Age 3-4', 'Age 4-5', 'Age 5-6', 'Age 6-7', 'Age 7-8', 'Age 8-9', 'Age 9-10', 'Age 10-11', 'Age 11-12', 'Age 12-13', 'Age 13-14', 'Age 14-15', 'Age 15-16'],
    helpText: 'Usually sized generously - consider room for growth'
  },
  {
    id: 'pe_kit',
    name: 'PE Kit',
    inputType: 'age_ranges',
    description: 'PE shorts, t-shirts, and sports uniforms',
    options: ['Age 3-4', 'Age 4-5', 'Age 5-6', 'Age 6-7', 'Age 7-8', 'Age 8-9', 'Age 9-10', 'Age 10-11', 'Age 11-12', 'Age 12-13', 'Age 13-14', 'Age 14-15', 'Age 15-16']
  },
  {
    id: 'accessories',
    name: 'Accessories',
    inputType: 'text_input',
    description: 'School bags, hats, ties, and other accessories',
    placeholder: 'e.g., Small backpack, Medium hat, Standard tie',
    helpText: 'Describe size or note if one-size-fits-all'
  },
  {
    id: 'other',
    name: 'Other Items',
    inputType: 'text_input',
    description: 'Any other school uniform items',
    placeholder: 'Describe the item and size',
    helpText: 'For items not covered by other categories'
  }
];

interface SizeSelectorProps {
  currentSizes: Record<string, string>;
  onChange: (sizes: Record<string, string>) => void;
  showAllCategories?: boolean;
}

export function SizeSelector({ currentSizes, onChange, showAllCategories = false }: SizeSelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    Object.keys(currentSizes).length > 0 ? Object.keys(currentSizes) : ['shirt', 'trousers', 'shoes']
  );

  const addCategory = (categoryId: string) => {
    if (!selectedCategories.includes(categoryId)) {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const removeCategory = (categoryId: string) => {
    const newCategories = selectedCategories.filter(id => id !== categoryId);
    setSelectedCategories(newCategories);
    
    // Remove the size from currentSizes
    const newSizes = { ...currentSizes };
    delete newSizes[categoryId];
    onChange(newSizes);
  };

  const updateSize = (categoryId: string, size: string) => {
    onChange({
      ...currentSizes,
      [categoryId]: size
    });
  };

  const availableCategories = UNIFORM_SIZE_CATEGORIES.filter(
    cat => !selectedCategories.includes(cat.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Current Sizes</Label>
        {!showAllCategories && (
          <Select onValueChange={(value) => addCategory(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Add size category" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid gap-4">
        {(showAllCategories ? UNIFORM_SIZE_CATEGORIES : 
          UNIFORM_SIZE_CATEGORIES.filter(cat => selectedCategories.includes(cat.id))
        ).map((category) => (
          <Card key={category.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm">{category.name}</CardTitle>
                  {category.description && (
                    <CardDescription className="text-xs">{category.description}</CardDescription>
                  )}
                </div>
                {!showAllCategories && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                    onClick={() => removeCategory(category.id)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {category.inputType === 'text_input' ? (
                  <Input
                    value={currentSizes[category.id] || ''}
                    onChange={(e) => updateSize(category.id, e.target.value)}
                    placeholder={category.placeholder}
                    className="h-8"
                  />
                ) : (
                  <Select
                    value={currentSizes[category.id] || ''}
                    onValueChange={(value) => updateSize(category.id, value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder={`Select ${category.name.toLowerCase()} size`} />
                    </SelectTrigger>
                    <SelectContent>
                      {category.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {category.helpText && (
                  <div className="flex items-start gap-1 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{category.helpText}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCategories.length === 0 && !showAllCategories && (
        <div className="text-center py-6 text-muted-foreground">
          <p>No size categories selected.</p>
          <p className="text-sm">Add categories using the dropdown above.</p>
        </div>
      )}

      {Object.keys(currentSizes).length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Size Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {Object.entries(currentSizes)
                .filter(([_, size]) => size.trim() !== '')
                .map(([categoryId, size]) => {
                  const category = UNIFORM_SIZE_CATEGORIES.find(cat => cat.id === categoryId);
                  return (
                    <Badge key={categoryId} variant="secondary" className="text-xs">
                      {category?.name}: {size}
                    </Badge>
                  );
                })}
            </div>
            {Object.entries(currentSizes).filter(([_, size]) => size.trim() !== '').length === 0 && (
              <p className="text-sm text-muted-foreground">No sizes specified yet</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}