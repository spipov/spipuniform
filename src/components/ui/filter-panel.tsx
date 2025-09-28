import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Filter, ChevronDown, X, RotateCcw } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterSection {
  id: string;
  title: string;
  type: 'checkbox' | 'select' | 'range' | 'radio';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  footer?: React.ReactNode;
}

interface FilterPanelProps {
  sections: FilterSection[];
  activeFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  className?: string;
  collapsible?: boolean;
}

export function FilterPanel({
  sections,
  activeFilters,
  onFiltersChange,
  className = '',
  collapsible = false
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(!collapsible);

  const updateFilter = (sectionId: string, value: any) => {
    const newFilters = { ...activeFilters };

    if (value === null || value === undefined || value === '' || value === 'all') {
      delete newFilters[sectionId];
    } else {
      newFilters[sectionId] = value;
    }

    onFiltersChange(newFilters);
  };

  const clearFilter = (sectionId: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[sectionId];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).length;
  };

  const renderFilterSection = (section: FilterSection) => {
    const activeValue = activeFilters[section.id];

    return (
      <div key={section.id} className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{section.title}</Label>
          {activeValue !== undefined && activeValue !== null && activeValue !== '' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearFilter(section.id)}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {section.type === 'checkbox' && section.options && (
          <div className="space-y-2">
            {section.options.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${section.id}-${option.id}`}
                  checked={Array.isArray(activeValue) && activeValue.includes(option.id)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(activeValue) ? activeValue : [];
                    let newValues;

                    if (checked) {
                      newValues = [...currentValues, option.id];
                    } else {
                      newValues = currentValues.filter((v: string) => v !== option.id);
                    }

                    updateFilter(section.id, newValues.length > 0 ? newValues : null);
                  }}
                />
                <Label
                  htmlFor={`${section.id}-${option.id}`}
                  className="text-sm flex-1 flex items-center justify-between"
                >
                  {option.label}
                  {option.count !== undefined && (
                    <Badge variant="secondary" className="text-xs ml-2">
                      {option.count}
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </div>
        )}

        {section.type === 'select' && section.options && (
            <Select
              value={activeValue || 'all'}
              onValueChange={(value) => updateFilter(section.id, value === 'all' ? 'all' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${section.title.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {section.title.toLowerCase()}</SelectItem>
                {section.options.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                    {option.count !== undefined && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

        {section.type === 'range' && section.min !== undefined && section.max !== undefined && (
          <div className="space-y-3">
            <div className="px-2">
              <Slider
                value={activeValue || [section.min, section.max]}
                onValueChange={(value) => updateFilter(section.id, value)}
                min={section.min}
                max={section.max}
                step={section.step || 1}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {section.min}{section.unit}
              </span>
              <span className="font-medium">
                {Array.isArray(activeValue)
                  ? `${activeValue[0]}${section.unit} - ${activeValue[1]}${section.unit}`
                  : `${section.min}${section.unit} - ${section.max}${section.unit}`
                }
              </span>
              <span>
                {section.max}{section.unit}
              </span>
            </div>
          </div>
        )}

        {section.type === 'radio' && section.options && (
          <div className="space-y-2">
            {section.options.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${section.id}-${option.id}`}
                  name={section.id}
                  value={option.id}
                  checked={activeValue === option.id}
                  onChange={(e) => updateFilter(section.id, e.target.value || null)}
                  className="radio"
                />
                <Label
                  htmlFor={`${section.id}-${option.id}`}
                  className="text-sm flex-1 flex items-center justify-between"
                >
                  {option.label}
                  {option.count !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      {option.count}
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </div>
        )}

        {section.footer && (
          <div className="mt-3 pt-3 border-t">
            {section.footer}
          </div>
        )}
      </div>
    );
  };

  const content = (
    <div className="space-y-4">
      {/* Header with filter count and clear all */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="text-xs">
              {getActiveFilterCount()}
            </Badge>
          )}
        </div>
        {getActiveFilterCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      {/* Filter sections */}
      <div className="space-y-6">
        {sections.map(section => renderFilterSection(section))}
      </div>
    </div>
  );

  if (collapsible) {
    return (
      <Card className={className}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
              {getActiveFilterCount() > 0 && (
                <CardDescription>
                  {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
                </CardDescription>
              )}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {content}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        {content}
      </CardContent>
    </Card>
  );
}