import React, { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Heart,
  Search,
  Filter,
  HeartOff,
  Package,
  School,
  MapPin,
  Eye,
  Calendar,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Euro,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';

export const Route = createFileRoute('/marketplace/favorites')(
  {
    component: FavoritesPage,
  }
);

function FavoritesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Fetch favorites
  const { data: favoritesData, isLoading, error, refetch } = useQuery({
    queryKey: ['user-favorites', currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      const response = await fetch(`/api/favorites?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch favorites');
      return response.json();
    },
    enabled: !!session?.user,
  });
  
  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      const response = await fetch(`/api/favorites?favoriteId=${favoriteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to remove favorite');
      return response.json();
    },
    onSuccess: (data, favoriteId) => {
      toast.success('Removed from favorites');
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-search'] });
      // Update browse page data if cached
      queryClient.refetchQueries({ queryKey: ['marketplace-search'] });
    },
    onError: (error) => {
      console.error('Failed to remove favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  });
  
  const favorites = favoritesData?.favorites || [];
  const pagination = favoritesData?.pagination;
  
  // Filter favorites based on search
  const filteredFavorites = favorites.filter((favorite: any) => {
    if (!searchQuery) return true;
    const listing = favorite.listing;
    return (
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.school?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  // Sort favorites
  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    const listingA = a.listing;
    const listingB = b.listing;
    
    switch (sortBy) {
      case 'newest':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case 'oldest':  
        return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      case 'price_low':
        const priceA = listingA.isFree ? 0 : parseFloat(listingA.price || '0');
        const priceB = listingB.isFree ? 0 : parseFloat(listingB.price || '0');
        return priceA - priceB;
      case 'price_high':
        const priceA2 = listingA.isFree ? 0 : parseFloat(listingA.price || '0');
        const priceB2 = listingB.isFree ? 0 : parseFloat(listingB.price || '0');
        return priceB2 - priceA2;
      case 'title':
        return listingA.title.localeCompare(listingB.title);
      default:
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
  });
  
  const handleRemoveFavorite = (favoriteId: string, listingTitle: string) => {
    if (confirm(`Remove "${listingTitle}" from your favorites?`)) {
      removeFavoriteMutation.mutate(favoriteId);
    }
  };
  
  const FavoriteCard = ({ favorite, index }: { favorite: any, index: number }) => {
    const { listing, favoriteId, addedAt } = favorite;
    
    return (
      <Card key={favoriteId} className="hover:shadow-md transition-shadow relative">
        <CardContent className="p-0">
          <div className={viewMode === 'grid' ? 'space-y-4' : 'flex space-x-4'}>
            {/* Image */}
            <div className={`${viewMode === 'grid' ? 'aspect-square' : 'w-32 h-32 flex-shrink-0'} bg-muted rounded-t-lg ${viewMode === 'list' ? 'rounded-lg' : ''} overflow-hidden relative`}>
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
              
              {/* Favorite indicator */}
              <div className="absolute top-2 right-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  onClick={() => handleRemoveFavorite(favoriteId, listing.title)}
                  disabled={removeFavoriteMutation.isPending}
                >
                  <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                </Button>
              </div>
              
              {listing.imageCount > 1 && (
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  +{listing.imageCount - 1}
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className={`${viewMode === 'grid' ? 'p-4' : 'flex-1 py-4 pr-4'} space-y-2`}>
              <div className="flex items-start justify-between">
                <Link 
                  to={`/marketplace/listings/${listing.id}`}
                  className="text-lg font-medium hover:underline line-clamp-2 flex-1"
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
              
              {listing.description && viewMode === 'list' && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {listing.description}
                </p>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {listing.viewCount || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Added {new Date(addedAt).toLocaleDateString()}
                  </div>
                </div>
                
                {listing.status !== 'active' && (
                  <Badge variant="secondary" className="text-xs">
                    {listing.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500" />
              My Favorites
            </h1>
            <p className="text-muted-foreground">
              {favoritesData ? `${favoritesData.pagination.totalCount} saved items` : 'Loading...'}
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
        </div>
      </div>
      
      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Recently added</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="title">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Results */}
      {isLoading ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {Array.from({ length: 6 }).map((_, i) => (
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
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load favorites</h3>
            <p className="text-muted-foreground mb-4">
              There was a problem loading your saved items.
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : sortedFavorites.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No matches found</h3>
                <p className="text-muted-foreground mb-4">
                  No favorites match your search for "{searchQuery}".
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <HeartOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start browsing the marketplace and save items you're interested in.
                  You can favorite listings by clicking the heart icon.
                </p>
                <Link to="/marketplace/browse">
                  <Button>
                    <Search className="mr-2 h-4 w-4" />
                    Browse Marketplace
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {sortedFavorites.map((favorite, index) => (
              <FavoriteCard key={favorite.favoriteId} favorite={favorite} index={index} />
            ))}
          </div>
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!pagination.hasPreviousPage}
                onClick={() => setCurrentPage(prev => prev - 1)}
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
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}