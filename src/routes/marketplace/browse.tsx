import React, { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Grid3x3, 
  List, 
  SlidersHorizontal,
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
  const [localFilters, setLocalFilters] = useState<SearchParams>(searchParams);
  const [priceRange, setPriceRange] = useState([0, 200]);
  
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
    setLocalFilters({});
  };
  
  const applyLocalFilters = () => {
    updateSearch(localFilters);
  };
  
  const handlePriceRangeChange = (range: number[]) => {
    setPriceRange(range);
    setLocalFilters(prev => ({ 
      ...prev, 
      minPrice: range[0] > 0 ? range[0] : undefined, 
      maxPrice: range[1] < 200 ? range[1] : undefined 
    }));
  };
  
  const results = searchResults?.results || [];
  const pagination = searchResults?.pagination;
  const summary = searchResults?.resultsSummary;
  
  const activeFiltersCount = Object.values(searchParams).filter(v => 
    v !== undefined && v !== null && v !== '' && v !== 'newest'
  ).length;
  
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description, or school..."
            value={localFilters.q || ''}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, q: e.target.value }))}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select 
          value={localFilters.categoryId || ''} 
          onValueChange={(value) => setLocalFilters(prev => ({ 
            ...prev, 
            categoryId: value || undefined,
            productTypeId: undefined // Reset product type when category changes
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories?.map((category: any) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Product Type Filter */}
      {localFilters.categoryId && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Product Type</label>
          <Select 
            value={localFilters.productTypeId || ''} 
            onValueChange={(value) => setLocalFilters(prev => ({ ...prev, productTypeId: value || undefined }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All product types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All product types</SelectItem>
              {categories
                ?.find((c: any) => c.id === localFilters.categoryId)?.productTypes
                ?.map((type: any) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* School Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">School</label>
        <Select 
          value={localFilters.schoolId || ''} 
          onValueChange={(value) => setLocalFilters(prev => ({ ...prev, schoolId: value || undefined }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="All schools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All schools</SelectItem>
            {schools?.slice(0, 50).map((school: any) => (
              <SelectItem key={school.id} value={school.id}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Price Range */}
      <div className="space-y-4">
        <label className="text-sm font-medium">Price Range</label>
        <div className="px-3">
          <Slider
            value={priceRange}
            onValueChange={handlePriceRangeChange}
            max={200}
            min={0}
            step={5}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>€{priceRange[0]}</span>
          <span>€{priceRange[1]}+</span>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="includeFree"
            checked={localFilters.includeFree !== false}
            onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, includeFree: checked as boolean }))}
          />
          <label htmlFor="includeFree" className="text-sm">Include free items</label>
        </div>
      </div>
      
      {/* Condition Filters */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Condition</label>
        <div className="space-y-2">
          {conditions?.map((condition: any) => (
            <div key={condition.id} className="flex items-center space-x-2">
              <Checkbox 
                id={condition.id}
                checked={localFilters.conditionIds?.includes(condition.id) || false}
                onCheckedChange={(checked) => {
                  const current = localFilters.conditionIds || [];
                  if (checked) {
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      conditionIds: [...current, condition.id]
                    }));
                  } else {
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      conditionIds: current.filter(id => id !== condition.id)
                    }));
                  }
                }}
              />
              <label htmlFor={condition.id} className="text-sm">
                {condition.name}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Advanced Filters */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Advanced</label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="hasImages"
              checked={localFilters.hasImages || false}
              onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, hasImages: checked as boolean }))}
            />
            <label htmlFor="hasImages" className="text-sm">Has images</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="allowOffers"
              checked={localFilters.allowOffers || false}
              onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, allowOffers: checked as boolean }))}
            />
            <label htmlFor="allowOffers" className="text-sm">Accepts offers</label>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Apply/Clear Buttons */}
      <div className="flex gap-3">
        <Button onClick={applyLocalFilters} className="flex-1">
          Apply Filters
        </Button>
        <Button variant="outline" onClick={clearFilters}>
          Clear All
        </Button>
      </div>
    </div>
  );
  
  const ListingCard = ({ listing, index }: { listing: any, index: number }) => (
    <Card key={listing.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className={viewMode === 'grid' ? 'space-y-4' : 'flex space-x-4'}>
          {/* Image */}
          <div className={`${viewMode === 'grid' ? 'aspect-square' : 'w-32 h-32 flex-shrink-0'} bg-muted rounded-t-lg ${viewMode === 'list' ? 'rounded-lg' : ''} overflow-hidden`}>
            {listing.primaryImage ? (
              <img 
                src={listing.primaryImage} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {listing.imageCount > 1 && (
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                +{listing.imageCount - 1}
              </div>
            )}
            
            {/* Favorite button */}
            <div className="absolute top-2 right-2">
              <FavoriteButton 
                listingId={listing.id}
                listingTitle={listing.title}
                className="bg-white/80 hover:bg-white"
              />
            </div>
          </div>
          
          {/* Content */}
          <div className={`${viewMode === 'grid' ? 'p-4' : 'flex-1 py-4 pr-4'} space-y-2`}>
            <div className="flex items-start justify-between">
              <Link 
                to={`/marketplace/listings/${listing.id}`}
                className="text-lg font-medium hover:underline line-clamp-1"
              >
                {listing.title}
              </Link>
              <div className="flex items-center gap-2 ml-2">
                {listing.isFree ? (
                  <Badge className="bg-green-500 text-xs">FREE</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    €{listing.price}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <School className="h-3 w-3" />
              <span>{listing.school?.name}</span>
              {listing.distance && (
                <>
                  <MapPin className="h-3 w-3" />
                  <span>{listing.distance}km away</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {listing.condition?.name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {listing.category?.name}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {listing.viewCount || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  0
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(listing.publishedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
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
              {summary ? `${summary.totalResults.toLocaleString()} items available` : 'Loading...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-7 w-7 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-7 w-7 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Mobile Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Narrow down your search
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <div className="flex gap-6">
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block w-80 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FilterContent />
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 space-y-4">
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
            <>
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {results.map((listing, index) => (
                  <ListingCard key={listing.id} listing={listing} index={index} />
                ))}
              </div>
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => updateSearch({ page: (searchParams.page || 1) - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!pagination.hasNextPage}
                    onClick={() => updateSearch({ page: (searchParams.page || 1) + 1 })}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
