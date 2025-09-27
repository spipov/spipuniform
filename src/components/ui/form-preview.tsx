import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductFormData } from './dynamic-product-form';
import { ProductAttribute } from './attribute-input';
import { Eye, Package, Tag, Image, AlertCircle } from 'lucide-react';

interface FormPreviewProps {
  formData: ProductFormData;
  productType?: {
    id: string;
    name: string;
    attributes: ProductAttribute[];
  };
  onEdit?: () => void;
  className?: string;
}

export function FormPreview({
  formData,
  productType,
  onEdit,
  className = ''
}: FormPreviewProps) {
  const formatPrice = (price: number, currency = '€') => {
    return `${currency}${price.toFixed(2)}`;
  };

  const renderAttributeValue = (attribute: ProductAttribute, value: any) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-muted-foreground">Not specified</span>;
    }

    switch (attribute.type) {
      case 'boolean':
        return value ? (
          <Badge variant="default" className="bg-green-100 text-green-800">Yes</Badge>
        ) : (
          <Badge variant="secondary">No</Badge>
        );

      case 'select':
      case 'radio':
        const option = attribute.options?.find(opt => opt.value === value);
        return option ? (
          <div className="flex items-center gap-2">
            {option.color && (
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: option.color }}
              />
            )}
            <span>{option.label || option.value}</span>
          </div>
        ) : (
          <span>{value}</span>
        );

      case 'multiselect':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((val: string, index: number) => {
                const option = attribute.options?.find(opt => opt.value === val);
                return (
                  <Badge key={index} variant="outline" className="text-xs">
                    {option?.label || val}
                  </Badge>
                );
              })}
            </div>
          );
        }
        return <span className="text-muted-foreground">None selected</span>;

      case 'range':
        return (
          <span>
            {value}{attribute.unit}
            {attribute.min !== undefined && attribute.max !== undefined && (
              <span className="text-muted-foreground text-xs ml-1">
                (range: {attribute.min}-{attribute.max}{attribute.unit})
              </span>
            )}
          </span>
        );

      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: value }}
            />
            <span>{value}</span>
          </div>
        );

      default:
        return <span>{String(value)}</span>;
    }
  };

  const hasContent = () => {
    return formData.title ||
           formData.description ||
           formData.price > 0 ||
           formData.images.length > 0 ||
           formData.tags.length > 0 ||
           Object.keys(formData.attributes).length > 0;
  };

  if (!hasContent()) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No data to preview</p>
            <p className="text-sm">Fill out the form to see a preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Form Preview
            </CardTitle>
            <CardDescription>
              This is how your listing will appear to other users
            </CardDescription>
          </div>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{formData.title || 'Untitled Listing'}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{formData.category}</Badge>
              <Badge variant="secondary">{formData.condition}</Badge>
              {formData.price > 0 && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {formatPrice(formData.price, formData.currency)}
                </Badge>
              )}
            </div>
          </div>

          {formData.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{formData.description}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Images */}
        {formData.images.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Image className="h-4 w-4" />
              Images ({formData.images.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {formData.images.map((url, index) => (
                <div key={index} className="aspect-square bg-muted rounded-md overflow-hidden">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {formData.tags.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Dynamic Attributes */}
        {productType && Object.keys(formData.attributes).length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Item Details</h4>
              <div className="space-y-3">
                {productType.attributes
                  .filter(attr => formData.attributes[attr.id] !== undefined &&
                                 formData.attributes[attr.id] !== null &&
                                 formData.attributes[attr.id] !== '')
                  .map((attribute) => (
                    <div key={attribute.id}>
                      <div className="font-medium text-sm mb-1">{attribute.name}</div>
                      <div className="text-sm">
                        {renderAttributeValue(attribute, formData.attributes[attribute.id])}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Missing Information Warning */}
        {!formData.title && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Title is required for the listing to be complete.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}