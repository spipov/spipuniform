import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  AlertCircle,
  Package,
  Heart,
  MessageCircle,
  Star
} from 'lucide-react';

export interface ResultItem {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  image?: string;
  category?: string;
  condition?: string;
  school?: string;
  location?: string;
  favorite?: boolean;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface ResultsListProps {
  items: ResultItem[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onItemClick?: (item: ResultItem) => void;
  onFavorite?: (itemId: string) => void;
  onContact?: (itemId: string) => void;
  showViewToggle?: boolean;
  showSort?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'rating';

export function ResultsList({
  items,
  loading = false,
  error = null,
  emptyMessage = "No items found",
  onItemClick,
  onFavorite,
  onContact,
  showViewToggle = true,
  showSort = true,
  className = ''
}: ResultsListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (option: SortOption) => {
    setSortBy(option);

    // Auto-determine sort direction for certain options
    if (option === 'price-asc') setSortDirection('asc');
    else if (option === 'price-desc') setSortDirection('desc');
    else if (option === 'newest') setSortDirection('desc');
    else setSortDirection('asc');
  };

  const formatPrice = (price?: number, currency = '€') => {
    if (price === undefined) return '';
    return `${currency}${price.toFixed(2)}`;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderItemCard = (item: ResultItem) => (
    <Card
      key={item.id}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onItemClick?.(item)}
    >
      <CardHeader className="pb-3">
        <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base line-clamp-2">{item.title}</CardTitle>
          {item.description && (
            <CardDescription className="line-clamp-2">
              {item.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Price and badges */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-primary">
              {formatPrice(item.price, item.currency)}
            </div>
            <div className="flex items-center gap-1">
              {item.condition && (
                <Badge variant="outline" className="text-xs">
                  {item.condition}
                </Badge>
              )}
              {item.favorite && (
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              )}
            </div>
          </div>

          {/* School and location */}
          {(item.school || item.location) && (
            <div className="text-xs text-muted-foreground space-y-1">
              {item.school && <div>🏫 {item.school}</div>}
              {item.location && <div>📍 {item.location}</div>}
            </div>
          )}

          {/* Rating */}
          {item.rating && (
            <div className="flex items-center gap-2">
              {renderStars(item.rating)}
              <span className="text-xs text-muted-foreground">
                {item.rating} ({item.reviewCount || 0})
              </span>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              View Details
            </Button>
            {onContact && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onContact(item.id);
                }}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
            {onFavorite && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite(item.id);
                }}
              >
                <Heart className={`h-4 w-4 ${item.favorite ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderItemList = (item: ResultItem) => (
    <Card
      key={item.id}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onItemClick?.(item)}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium line-clamp-1">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold text-primary">
                  {formatPrice(item.price, item.currency)}
                </div>
                {item.condition && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {item.condition}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {item.school && <span>🏫 {item.school}</span>}
              {item.location && <span>📍 {item.location}</span>}
              {item.category && <span>📂 {item.category}</span>}
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 4).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{item.tags.length - 4}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.rating && renderStars(item.rating)}
                {item.reviewCount && item.reviewCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({item.reviewCount} reviews)
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {onContact && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onContact(item.id);
                    }}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Contact
                  </Button>
                )}
                {onFavorite && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavorite(item.id);
                    }}
                  >
                    <Heart className={`h-3 w-3 mr-1 ${item.favorite ? 'fill-current' : ''}`} />
                    {item.favorite ? 'Saved' : 'Save'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Loading header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>

        {/* Loading items */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No items found</h3>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {items.length} item{items.length !== 1 ? 's' : ''} found
        </div>

        <div className="flex items-center gap-2">
          {showSort && (
            <Select value={sortBy} onValueChange={handleSort}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          )}

          {showViewToggle && (
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
      }>
        {items.map(item => viewMode === 'grid' ? renderItemCard(item) : renderItemList(item))}
      </div>
    </div>
  );
}