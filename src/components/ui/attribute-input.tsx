import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Check, X } from 'lucide-react';
// Simple date formatting utility
const formatDate = (date: Date, formatStr: string): string => {
  const options: Intl.DateTimeFormatOptions = {};
  if (formatStr.includes('PPP')) {
    options.year = 'numeric';
    options.month = 'long';
    options.day = 'numeric';
  }
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

export interface AttributeValue {
  id: string;
  value: string;
  label?: string;
  color?: string;
  image?: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'number' | 'range' | 'boolean' | 'date' | 'color' | 'file';
  required: boolean;
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: AttributeValue[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

interface AttributeInputProps {
  attribute: ProductAttribute;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  className?: string;
}

export function AttributeInput({
  attribute,
  value,
  onChange,
  error,
  className = ''
}: AttributeInputProps) {
  const renderInput = () => {
    switch (attribute.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={attribute.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={attribute.placeholder}
            rows={3}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={attribute.placeholder}
            min={attribute.min}
            max={attribute.max}
            step={attribute.step}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'range':
        return (
          <div className="space-y-3">
            <div className="px-2">
              <Slider
                value={value ? [value] : [attribute.min || 0]}
                onValueChange={(values) => onChange(values[0])}
                min={attribute.min || 0}
                max={attribute.max || 100}
                step={attribute.step || 1}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{attribute.min}{attribute.unit}</span>
              <span className="font-medium">
                {value || attribute.min}{attribute.unit}
              </span>
              <span>{attribute.max}{attribute.unit}</span>
            </div>
          </div>
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={attribute.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {attribute.options?.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.color && (
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {option.label || option.value}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const selectedValues = value || [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1 min-h-[2.5rem] p-2 border rounded-md">
              {selectedValues.map((selectedValue: string) => {
                const option = attribute.options?.find(opt => opt.value === selectedValue);
                return (
                  <Badge key={selectedValue} variant="secondary" className="flex items-center gap-1">
                    {option?.label || selectedValue}
                    <button
                      type="button"
                      onClick={() => {
                        const newValues = selectedValues.filter((v: string) => v !== selectedValue);
                        onChange(newValues);
                      }}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            <Select
              value=""
              onValueChange={(newValue) => {
                if (newValue && !selectedValues.includes(newValue)) {
                  onChange([...selectedValues, newValue]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add option..." />
              </SelectTrigger>
              <SelectContent>
                {attribute.options?.filter(option => !selectedValues.includes(option.value)).map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.color && (
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      {option.label || option.value}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={attribute.id}
              checked={value || false}
              onCheckedChange={onChange}
            />
            <Label htmlFor={attribute.id} className="text-sm">
              {attribute.placeholder || attribute.name}
            </Label>
          </div>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${
                  !value ? 'text-muted-foreground' : ''
                } ${error ? 'border-red-500' : ''}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? formatDate(new Date(value), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date: Date | undefined) => onChange(date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-10 border rounded cursor-pointer"
            />
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={attribute.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label htmlFor={attribute.id} className="text-sm font-medium">
          {attribute.name}
          {attribute.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {attribute.description && (
          <span className="text-xs text-muted-foreground">
            {attribute.description}
          </span>
        )}
      </div>

      {renderInput()}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}