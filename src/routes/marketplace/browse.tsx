import React, { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Filter,
  Grid3x3,
  List,
  MapPin,
  Euro,
  Eye,
  Heart,
  MessageCircle,
  School,
  Package,
  ChevronLeft,
  ChevronRight,
  Star,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { FavoriteButton } from '@/components/marketplace/favorite-button';
import { HierarchicalMarketplaceFlow } from '@/components/marketplace/hierarchical-marketplace-flow';
import { UniversalSearchBox } from '@/components/ui/universal-search-box';
import { FilterPanel } from '@/components/ui/filter-panel';
import { ResultsList, type ResultItem } from '@/components/ui/results-list';

// Search parameters schema
interface SearchParams {
  q?: string;
  categoryId?: string;
  productTypeId?: string;
  schoolId?: string;
  localityId?: string;
  countyId?: string;
  minPrice?: number;
  maxPrice?: number;
  includeFree?: boolean;
  conditionIds?: string[];
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'distance' | 'popularity';
  page?: number;
  hasImages?: boolean;
  allowOffers?: boolean;
}

interface Listing {
  id: string;
  title: string;
  price?: number;
  isFree: boolean;
  condition?: { name: string };
  category?: { name: string };
  school?: { name: string };
  primaryImage?: string;
  imageCount?: number;
  viewCount?: number;
  publishedAt: string;
  distance?: number;
}

export const Route = createFileRoute('/marketplace/browse')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === 'string' ? search.q : undefined,
    categoryId: typeof search.categoryId === 'string' ? search.categoryId : undefined,
    productTypeId: typeof search.productTypeId === 'string' ? search.productTypeId : undefined,
    schoolId: typeof search.schoolId === 'string' ? search.schoolId : undefined,
    localityId: typeof search.localityId === 'string' ? search.localityId : undefined,
    countyId: typeof search.countyId === 'string' ? search.countyId : undefined,
    minPrice: typeof search.minPrice === 'string' ? parseFloat(search.minPrice) : undefined,
    maxPrice: typeof search.maxPrice === 'string' ? parseFloat(search.maxPrice) : undefined,
    includeFree: search.includeFree === 'true',
    conditionIds: typeof search.conditionIds === 'string' ? search.conditionIds.split(',') : undefined,
    sortBy: typeof search.sortBy === 'string' && ['newest', 'oldest', 'price_low', 'price_high', 'distance', 'popularity'].includes(search.sortBy) 
      ? search.sortBy as any : 'newest',
    page: typeof search.page === 'string' ? parseInt(search.page) : 1,
    hasImages: search.hasImages === 'true',
    allowOffers: search.allowOffers === 'true'
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const { data: session } = useSession();
  const navigate = useNavigate({ from: '/marketplace/browse' });
  const searchParams = useSearch({ from: '/marketplace/browse' });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);

  // Fetch filter options for the FilterPanel component
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

  const { data: schools } = useQuery({
    queryKey: ['schools-list'],
    queryFn: async () => {
      const response = await fetch('/api/schools');
      if (!response.ok) throw new Error('Failed to fetch schools');
      const data = await response.json();
      return data.schools;
    }
  });

  // Main search query
  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ['marketplace-search', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();

      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else {
            params.set(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/marketplace/search?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to search listings');
      return response.json();
    },
    retry: 1
  });

  const updateSearch = (newParams: Partial<SearchParams>) => {
    const updatedParams = { ...searchParams, ...newParams, page: 1 };
    navigate({ search: updatedParams });
  };

  const clearFilters = () => {
    navigate({ search: { sortBy: 'newest' } });
  };

  const results = searchResults?.results || [];
  const pagination = searchResults?.pagination;
  const summary = searchResults?.resultsSummary;

  const activeFiltersCount = Object.values(searchParams).filter(v =>
    v !== undefined && v !== null && v !== '' && v !== 'newest'
  ).length;

  // Transform listings to ResultItem format for ResultsList component
  const transformedResults: ResultItem[] = results.map((listing: any) => ({
    id: listing.id,
    title: listing.title,
    description: `${listing.condition?.name || ''} ${listing.category?.name || ''}`.trim(),
    price: listing.price,
    currency: '€',
    category: listing.category?.name || '',
    condition: listing.condition?.name || '',
    school: listing.school?.name || '',
    location: listing.school?.locality?.name || '',
    rating: 0,
    reviewCount: 0,
    tags: [listing.condition?.name, listing.category?.name].filter(Boolean),
    favorite: false
  }));
  
  // Filter sections for FilterPanel component
  const filterSections = [
    {
      id: 'category',
      title: 'Category',
      type: 'select' as const,
      options: [
        { id: '', label: 'All categories', count: 0 },
        ...(categories?.map((category: any) => ({
          id: category.id,
          label: category.name,
          count: 0 // Would need to be calculated from API
        })) || [])
      ]
    },
    {
      id: 'productType',
      title: 'Product Type',
      type: 'select' as const,
      options: [
        { id: '', label: 'All product types', count: 0 },
        ...(categories
          ?.find((c: any) => c.id === searchParams.categoryId)?.productTypes
          ?.map((type: any) => ({
            id: type.id,
            label: type.name,
            count: 0
          })) || [])
      ]
    },
    {
      id: 'school',
      title: 'School',
      type: 'select' as const,
      options: [
        { id: '', label: 'All schools', count: 0 },
        ...(schools?.slice(0, 50).map((school: any) => ({
          id: school.id,
          label: school.name,
          count: 0
        })) || [])
      ]
    },
    {
      id: 'price',
      title: 'Price Range',
      type: 'range' as const,
      min: 0,
      max: 200,
      step: 5,
      unit: '€'
    },
    {
      id: 'condition',
      title: 'Condition',
      type: 'checkbox' as const,
      options: conditions?.map((condition: any) => ({
        id: condition.id,
        label: condition.name,
        count: 0
      })) || []
    },
    {
      id: 'includeFree',
      title: 'Include Free Items',
      type: 'checkbox' as const,
      options: [
        { id: 'true', label: 'Include free items', count: 0 }
      ]
    },
    {
      id: 'hasImages',
      title: 'Has Images',
      type: 'checkbox' as const,
      options: [
        { id: 'true', label: 'Has images', count: 0 }
      ]
    },
    {
      id: 'allowOffers',
      title: 'Accepts Offers',
      type: 'checkbox' as const,
      options: [
        { id: 'true', label: 'Accepts offers', count: 0 }
      ]
    }
  ];

  const handleSearch = (query: string) => {
    setLoading(true);
    updateSearch({ q: query });
    setTimeout(() => setLoading(false), 300);
  };

  const handleFiltersChange = (filters: Record<string, any>) => {
    const newParams: Partial<SearchParams> = {};

    if (filters.category && filters.category !== 'all') {
      newParams.categoryId = filters.category;
    }
    if (filters.productType && filters.productType !== 'all') {
      newParams.productTypeId = filters.productType;
    }
    if (filters.school && filters.school !== 'all') {
      newParams.schoolId = filters.school;
    }
    if (filters.price && Array.isArray(filters.price) && filters.price.length === 2) {
      newParams.minPrice = filters.price[0] > 0 ? filters.price[0] : undefined;
      newParams.maxPrice = filters.price[1] < 200 ? filters.price[1] : undefined;
    }
    if (filters.condition && Array.isArray(filters.condition)) {
      newParams.conditionIds = filters.condition;
    }
    if (filters.includeFree) {
      newParams.includeFree = true;
    }
    if (filters.hasImages) {
      newParams.hasImages = true;
    }
    if (filters.allowOffers) {
      newParams.allowOffers = true;
    }

    updateSearch(newParams);
  };

  const handleItemClick = (item: ResultItem) => {
    window.location.href = `/marketplace/listings/${item.id}`;
  };

  const handleFavorite = (itemId: string) => {
    console.log('Toggle favorite for item:', itemId);
  };

  const handleContact = (itemId: string) => {
    console.log('Contact seller for item:', itemId);
  };
  
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/marketplace">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Browse Uniforms</h1>
            <p className="text-muted-foreground">
              Find uniforms by location or use advanced search
            </p>
          </div>
        </div>
      </div>

      {/* Mobile-first hierarchical marketplace flow */}
      <HierarchicalMarketplaceFlow
        onRequestCreate={(schoolId) => {
          // Handle request creation - could navigate to requests page or show dialog
          toast.info('Request creation flow would start here');
        }}
        onListingCreate={(schoolId) => {
          // Handle listing creation - navigate to create page with school pre-filled
          window.location.href = `/marketplace/create?schoolId=${schoolId}`;
        }}
      />

      {/* Advanced search section */}
      <div className="mt-8 pt-8 border-t">
        <h2 className="text-xl font-semibold mb-4">Advanced Search</h2>

        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <div className="hidden md:block w-80 space-y-6">
            <FilterPanel
              sections={filterSections}
              activeFilters={{
                category: searchParams.categoryId,
                productType: searchParams.productTypeId,
                school: searchParams.schoolId,
                price: [searchParams.minPrice || 0, searchParams.maxPrice || 200],
                condition: searchParams.conditionIds,
                includeFree: searchParams.includeFree,
                hasImages: searchParams.hasImages,
                allowOffers: searchParams.allowOffers
              }}
              onFiltersChange={handleFiltersChange}
              collapsible={true}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Search Bar */}
            <UniversalSearchBox
              placeholder="Search for school uniforms, sports jerseys, or accessories..."
              onSearch={handleSearch}
              showFilters={true}
              className="w-full"
            />

            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {searchParams.q && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search results for:</span>
                    <Badge variant="outline">
                      "{searchParams.q}"
                      <button
                        onClick={() => updateSearch({ q: undefined })}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                )}

                {activeFiltersCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters ({activeFiltersCount})
                  </Button>
                )}
              </div>

              {/* Sort */}
              <Select
                value={searchParams.sortBy || 'newest'}
                onValueChange={(value) => updateSearch({ sortBy: value as any })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="popularity">Most popular</SelectItem>
                  <SelectItem value="distance">Nearest first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-0">
                      <div className={viewMode === 'grid' ? 'space-y-4' : 'flex space-x-4'}>
                        <Skeleton className={`${viewMode === 'grid' ? 'aspect-square' : 'w-32 h-32'} rounded-lg`} />
                        <div className={`${viewMode === 'grid' ? 'p-4' : 'flex-1 py-4 pr-4'} space-y-2`}>
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-20" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-destructive mb-4">Failed to load listings</p>
                  <Button onClick={() => refetch()}>Try Again</Button>
                </CardContent>
              </Card>
            ) : results.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No uniforms found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                    <Link to="/marketplace/create">
                      <Button>
                        Create a Listing
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ResultsList
                items={transformedResults}
                loading={isLoading}
                onItemClick={handleItemClick}
                onFavorite={handleFavorite}
                onContact={handleContact}
                showViewToggle={true}
                showSort={false} // We're handling sort separately above
                emptyMessage={
                  searchParams.q
                    ? `No items found for "${searchParams.q}". Try adjusting your search or filters.`
                    : "No items match your current filters. Try adjusting your filter criteria."
                }
              />
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        <div className="md:hidden">
          <FilterPanel
            sections={filterSections}
            activeFilters={{
              category: searchParams.categoryId,
              productType: searchParams.productTypeId,
              school: searchParams.schoolId,
              price: [searchParams.minPrice || 0, searchParams.maxPrice || 200],
              condition: searchParams.conditionIds,
              includeFree: searchParams.includeFree,
              hasImages: searchParams.hasImages,
              allowOffers: searchParams.allowOffers
            }}
            onFiltersChange={handleFiltersChange}
            collapsible={false}
          />
        </div>
      </div>
    </div>
  );
}
