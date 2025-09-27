import React, { useState, useMemo } from 'react';
import { UniversalSearchBox } from './universal-search-box';
import { FilterPanel } from './filter-panel';
import { ResultsList, type ResultItem } from './results-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Separator } from './separator';
import { Search, Filter, Grid3X3 } from 'lucide-react';

// Mock data for testing
const mockItems: ResultItem[] = [
  {
    id: '1',
    title: 'St. Mary\'s Primary School Uniform Set',
    description: 'Complete uniform set including jumper, trousers, and polo shirt. Excellent condition.',
    price: 45.00,
    currency: '€',
    category: 'Primary School',
    condition: 'Excellent',
    school: 'St. Mary\'s Primary School',
    location: 'Dublin City',
    rating: 4.5,
    reviewCount: 12,
    tags: ['complete set', 'excellent condition', 'primary school'],
    favorite: false
  },
  {
    id: '2',
    title: 'Secondary School Blazer - Navy Blue',
    description: 'Official school blazer in navy blue. Worn for 1 year only.',
    price: 35.00,
    currency: '€',
    category: 'Secondary School',
    condition: 'Good',
    school: 'Dublin High School',
    location: 'Dublin City',
    rating: 4.0,
    reviewCount: 8,
    tags: ['blazer', 'navy blue', 'secondary school'],
    favorite: true
  },
  {
    id: '3',
    title: 'Sports Jersey - Green',
    description: 'School sports jersey in house colors. Great condition.',
    price: 15.00,
    currency: '€',
    category: 'Sports',
    condition: 'Very Good',
    school: 'Cork Community School',
    location: 'Cork City',
    rating: 4.8,
    reviewCount: 15,
    tags: ['sports', 'jersey', 'green'],
    favorite: false
  },
  {
    id: '4',
    title: 'School Tracksuit - Full Set',
    description: 'Complete tracksuit with school crest. Perfect for PE classes.',
    price: 55.00,
    currency: '€',
    category: 'Sports',
    condition: 'New',
    school: 'Galway Primary School',
    location: 'Galway City',
    rating: 5.0,
    reviewCount: 3,
    tags: ['tracksuit', 'new', 'complete set'],
    favorite: false
  },
  {
    id: '5',
    title: 'School Tie - Official',
    description: 'Official school tie with crest. Brand new, never worn.',
    price: 8.00,
    currency: '€',
    category: 'Accessories',
    condition: 'New',
    school: 'Limerick Secondary School',
    location: 'Limerick City',
    rating: 4.2,
    reviewCount: 6,
    tags: ['tie', 'new', 'official'],
    favorite: true
  },
  {
    id: '6',
    title: 'School Skirt - Grey',
    description: 'Grey school skirt, knee length. Good condition.',
    price: 12.00,
    currency: '€',
    category: 'Secondary School',
    condition: 'Good',
    school: 'Waterford High School',
    location: 'Waterford City',
    rating: 3.8,
    reviewCount: 9,
    tags: ['skirt', 'grey', 'secondary school'],
    favorite: false
  }
];

const filterSections = [
  {
    id: 'category',
    title: 'Category',
    type: 'checkbox' as const,
    options: [
      { id: 'primary', label: 'Primary School', count: 150 },
      { id: 'secondary', label: 'Secondary School', count: 89 },
      { id: 'sports', label: 'Sports', count: 67 },
      { id: 'accessories', label: 'Accessories', count: 34 }
    ]
  },
  {
    id: 'condition',
    title: 'Condition',
    type: 'checkbox' as const,
    options: [
      { id: 'new', label: 'New', count: 45 },
      { id: 'excellent', label: 'Excellent', count: 78 },
      { id: 'very-good', label: 'Very Good', count: 92 },
      { id: 'good', label: 'Good', count: 65 },
      { id: 'fair', label: 'Fair', count: 23 }
    ]
  },
  {
    id: 'price',
    title: 'Price Range',
    type: 'range' as const,
    min: 0,
    max: 100,
    step: 5,
    unit: '€'
  },
  {
    id: 'location',
    title: 'Location',
    type: 'select' as const,
    options: [
      { id: 'dublin', label: 'Dublin', count: 125 },
      { id: 'cork', label: 'Cork', count: 89 },
      { id: 'galway', label: 'Galway', count: 67 },
      { id: 'limerick', label: 'Limerick', count: 45 },
      { id: 'waterford', label: 'Waterford', count: 34 }
    ]
  }
];

export function SearchComponentsTest() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Simulate search and filtering
  const filteredItems = useMemo(() => {
    let filtered = mockItems;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.school?.toLowerCase().includes(query) ||
        item.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      switch (key) {
        case 'category':
          if (Array.isArray(value) && value.length > 0) {
            filtered = filtered.filter(item =>
              value.some((cat: string) => {
                switch (cat) {
                  case 'primary': return item.category === 'Primary School';
                  case 'secondary': return item.category === 'Secondary School';
                  case 'sports': return item.category === 'Sports';
                  case 'accessories': return item.category === 'Accessories';
                  default: return false;
                }
              })
            );
          }
          break;

        case 'condition':
          if (Array.isArray(value) && value.length > 0) {
            filtered = filtered.filter(item =>
              value.includes(item.condition?.toLowerCase().replace(' ', '-'))
            );
          }
          break;

        case 'price':
          if (Array.isArray(value) && value.length === 2) {
            const [min, max] = value;
            filtered = filtered.filter(item =>
              (item.price || 0) >= min && (item.price || 0) <= max
            );
          }
          break;

        case 'location':
          if (value) {
            filtered = filtered.filter(item =>
              item.location?.toLowerCase().includes(value.toLowerCase())
            );
          }
          break;
      }
    });

    return filtered;
  }, [searchQuery, activeFilters]);

  const handleSearch = (query: string) => {
    setLoading(true);
    setSearchQuery(query);

    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  const handleFiltersChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
  };

  const handleItemClick = (item: ResultItem) => {
    console.log('Item clicked:', item);
  };

  const handleFavorite = (itemId: string) => {
    console.log('Toggle favorite for item:', itemId);
  };

  const handleContact = (itemId: string) => {
    console.log('Contact seller for item:', itemId);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Components Test
          </CardTitle>
          <CardDescription>
            Testing UniversalSearchBox, FilterPanel, and ResultsList components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Bar */}
          <div className="space-y-4">
            <UniversalSearchBox
              placeholder="Search for school uniforms, sports jerseys, or accessories..."
              onSearch={handleSearch}
              showFilters={true}
              className="w-full"
            />

            {/* Active filters summary */}
            {Object.keys(activeFilters).length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Active filters:</span>
                {Object.entries(activeFilters).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {Array.isArray(value) ? value.join(', ') : value}
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <FilterPanel
                sections={filterSections}
                activeFilters={activeFilters}
                onFiltersChange={handleFiltersChange}
                collapsible={true}
              />
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <ResultsList
                items={filteredItems}
                loading={loading}
                onItemClick={handleItemClick}
                onFavorite={handleFavorite}
                onContact={handleContact}
                showViewToggle={true}
                showSort={true}
                emptyMessage={
                  searchQuery.trim()
                    ? `No items found for "${searchQuery}". Try adjusting your search or filters.`
                    : "No items match your current filters. Try adjusting your filter criteria."
                }
              />
            </div>
          </div>

          {/* Debug Info */}
          <Separator />
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-2 text-sm">
                <div>
                  <strong>Search Query:</strong> "{searchQuery}"
                </div>
                <div>
                  <strong>Active Filters:</strong> {Object.keys(activeFilters).length > 0
                    ? JSON.stringify(activeFilters, null, 2)
                    : 'None'
                  }
                </div>
                <div>
                  <strong>Results Count:</strong> {filteredItems.length}
                </div>
                <div>
                  <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}