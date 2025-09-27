import React, { useState } from 'react';
import { DynamicProductForm, type ProductFormData } from './dynamic-product-form';
import { FormPreview } from './form-preview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Badge } from './badge';
import { Separator } from './separator';
import { ProductAttribute } from './attribute-input';
import { FileText, Eye, Save, RotateCcw } from 'lucide-react';

// Sample product types with attributes
const sampleProductTypes = [
  {
    id: 'school-blazer',
    name: 'School Blazer',
    description: 'Traditional school blazer with specific measurements and styling',
    attributes: [
      {
        id: 'size',
        name: 'Size',
        type: 'select' as const,
        required: true,
        options: [
          { id: '1', value: '28', label: '28" Chest' },
          { id: '2', value: '30', label: '30" Chest' },
          { id: '3', value: '32', label: '32" Chest' },
          { id: '4', value: '34', label: '34" Chest' },
          { id: '5', value: '36', label: '36" Chest' }
        ]
      },
      {
        id: 'color',
        name: 'Color',
        type: 'select' as const,
        required: true,
        options: [
          { id: '1', value: 'navy', label: 'Navy Blue', color: '#000080' },
          { id: '2', value: 'black', label: 'Black', color: '#000000' },
          { id: '3', value: 'grey', label: 'Grey', color: '#808080' }
        ]
      },
      {
        id: 'material',
        name: 'Material',
        type: 'radio' as const,
        required: false,
        options: [
          { id: '1', value: 'wool', label: 'Wool Blend' },
          { id: '2', value: 'polyester', label: 'Polyester' },
          { id: '3', value: 'cotton', label: 'Cotton' }
        ]
      },
      {
        id: 'measurements',
        name: 'Custom Measurements',
        type: 'textarea' as const,
        required: false,
        placeholder: 'Enter specific measurements if known...'
      }
    ]
  },
  {
    id: 'sports-jersey',
    name: 'Sports Jersey',
    description: 'Sports team jersey with specific sizing and team colors',
    attributes: [
      {
        id: 'sport',
        name: 'Sport',
        type: 'select' as const,
        required: true,
        options: [
          { id: '1', value: 'football', label: 'Football' },
          { id: '2', value: 'basketball', label: 'Basketball' },
          { id: '3', value: 'rugby', label: 'Rugby' },
          { id: '4', value: 'hockey', label: 'Hockey' }
        ]
      },
      {
        id: 'team-colors',
        name: 'Team Colors',
        type: 'multiselect' as const,
        required: false,
        options: [
          { id: '1', value: 'red', label: 'Red', color: '#FF0000' },
          { id: '2', value: 'blue', label: 'Blue', color: '#0000FF' },
          { id: '3', value: 'green', label: 'Green', color: '#00FF00' },
          { id: '4', value: 'yellow', label: 'Yellow', color: '#FFFF00' },
          { id: '5', value: 'white', label: 'White', color: '#FFFFFF' },
          { id: '6', value: 'black', label: 'Black', color: '#000000' }
        ]
      },
      {
        id: 'player-number',
        name: 'Player Number',
        type: 'number' as const,
        required: false,
        min: 1,
        max: 99,
        placeholder: 'Enter player number'
      }
    ]
  }
];

export function DynamicFormComponentsTest() {
  const [selectedProductType, setSelectedProductType] = useState(sampleProductTypes[0]);
  const [formData, setFormData] = useState<Partial<ProductFormData>>({});
  const [activeTab, setActiveTab] = useState('form');
  const [savedData, setSavedData] = useState<ProductFormData[]>([]);

  const handleFormSubmit = (data: ProductFormData) => {
    setFormData(data);
    setSavedData(prev => [data, ...prev.slice(0, 4)]); // Keep last 5 submissions
    setActiveTab('preview');
  };

  const handleFormCancel = () => {
    setFormData({});
    setActiveTab('form');
  };

  const loadSampleData = () => {
    const sampleData: ProductFormData = {
      title: `Sample ${selectedProductType.name}`,
      description: `This is a sample ${selectedProductType.name.toLowerCase()} listing with various attributes filled in for testing purposes.`,
      price: Math.floor(Math.random() * 50) + 10,
      currency: '€',
      category: 'secondary',
      condition: 'good',
      images: [
        'https://via.placeholder.com/300x300?text=Sample+Image+1',
        'https://via.placeholder.com/300x300?text=Sample+Image+2'
      ],
      attributes: {},
      tags: ['sample', 'test', selectedProductType.name.toLowerCase()]
    };

    // Fill in some sample attributes
    selectedProductType.attributes.forEach((attr: ProductAttribute) => {
      switch (attr.type) {
        case 'text':
        case 'textarea':
          sampleData.attributes[attr.id] = `Sample ${attr.name.toLowerCase()} value`;
          break;
        case 'select':
        case 'radio':
          if (attr.options && attr.options.length > 0) {
            sampleData.attributes[attr.id] = attr.options[0].value;
          }
          break;
        case 'multiselect':
          if (attr.options && attr.options.length > 0) {
            sampleData.attributes[attr.id] = attr.options.slice(0, 2).map(opt => opt.value);
          }
          break;
        case 'number':
          sampleData.attributes[attr.id] = attr.min || 1;
          break;
        case 'range':
          sampleData.attributes[attr.id] = (attr.min || 0) + ((attr.max || 100) - (attr.min || 0)) / 2;
          break;
        case 'boolean':
          sampleData.attributes[attr.id] = Math.random() > 0.5;
          break;
        case 'date':
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 365));
          sampleData.attributes[attr.id] = date.toISOString();
          break;
        case 'color':
          sampleData.attributes[attr.id] = '#3B82F6';
          break;
      }
    });

    setFormData(sampleData);
  };

  const clearForm = () => {
    setFormData({});
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dynamic Form Components Test
          </CardTitle>
          <CardDescription>
            Testing DynamicProductForm, AttributeInput, and FormPreview components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Type Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Select Product Type</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {sampleProductTypes.map((type) => (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-colors ${
                      selectedProductType.id === type.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedProductType(type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{type.name}</h4>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {type.attributes.length} attributes
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {type.attributes.filter(a => a.required).length} required
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={loadSampleData} variant="outline">
                Load Sample Data
              </Button>
              <Button onClick={clearForm} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear Form
              </Button>
            </div>
          </div>

          <Separator />

          {/* Form and Preview Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Form
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-4">
              <DynamicProductForm
                productType={selectedProductType}
                initialData={formData}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <FormPreview
                formData={formData as ProductFormData}
                productType={selectedProductType}
                onEdit={() => setActiveTab('form')}
              />
            </TabsContent>
          </Tabs>

          {/* Recent Submissions */}
          {savedData.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Submissions</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {savedData.map((data, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setFormData(data);
                        setActiveTab('form');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium line-clamp-1">{data.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {data.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{data.category}</Badge>
                            <span className="font-semibold text-primary">
                              €{data.price.toFixed(2)}
                            </span>
                          </div>
                          {Object.keys(data.attributes).length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {Object.keys(data.attributes).length} attributes
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Debug Information */}
          <Separator />
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-2 text-sm">
                <div>
                  <strong>Selected Product Type:</strong> {selectedProductType.name}
                </div>
                <div>
                  <strong>Form Data Keys:</strong> {Object.keys(formData).join(', ')}
                </div>
                <div>
                  <strong>Attributes Count:</strong> {Object.keys(formData.attributes || {}).length}
                </div>
                <div>
                  <strong>Saved Submissions:</strong> {savedData.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}