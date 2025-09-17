import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  ShoppingBag, 
  Eye,
  Edit,
  Heart,
  Search,
  TrendingUp,
  Clock,
  Euro,
  MessageCircle,
  Star,
  Package,
  AlertCircle,
  CheckCircle2,
  Camera,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';

export const Route = createFileRoute('/marketplace/')(
  {
    component: MarketplaceDashboard,
  }
);

function MarketplaceDashboard() {
  const { data: session } = useSession();

  // Fetch user's listings
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['user-listings'],
    queryFn: async () => {
      const response = await fetch('/api/listings', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch listings');
      return response.json();
    },
    enabled: !!session?.user,
  });

  // Fetch marketplace stats (we can extend this later)
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['marketplace-stats'],
    queryFn: async () => {
      // This is a placeholder - we'll implement this API later
      return {
        totalViews: 0,
        totalFavorites: 0,
        totalMessages: 0,
        activeLisitngs: listingsData?.listings?.filter((l: any) => l.status === 'active')?.length || 0
      };
    },
    enabled: !!listingsData?.listings,
  });

  const listings = listingsData?.listings || [];
  const activeListings = listings.filter((l: any) => l.status === 'active');
  const draftListings = listings.filter((l: any) => l.status === 'draft');
  const pendingListings = listings.filter((l: any) => l.status === 'pending');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'draft':
        return 'bg-gray-500';
      case 'expired':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'draft':
        return <Edit className="h-3 w-3" />;
      case 'expired':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">
            Manage your listings, browse uniforms, and connect with other parents
          </p>
        </div>
        <Link to="/marketplace/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Listing
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeListings.length}</div>
            <p className="text-xs text-muted-foreground">
              {draftListings.length > 0 && `${draftListings.length} drafts`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.totalViews || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.totalFavorites || 0}</div>
            <p className="text-xs text-muted-foreground">Items liked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/marketplace/create" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Listing
              </Button>
            </Link>
            <Link to="/marketplace/browse" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <Search className="mr-2 h-4 w-4" />
                Browse Uniforms
              </Button>
            </Link>
            <Link to="/marketplace/requests" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <Heart className="mr-2 h-4 w-4" />
                My Requests
              </Button>
            </Link>
            <Link to="/marketplace/messages" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="mr-2 h-4 w-4" />
                Messages
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Listings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Listings</CardTitle>
              <CardDescription>
                Manage your active and draft listings
              </CardDescription>
            </div>
            <Link to="/marketplace/my-listings">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {listingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start selling your child's outgrown uniforms
                </p>
                <Link to="/marketplace/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Listing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.slice(0, 5).map((listing: any) => (
                  <div key={listing.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {listing.images?.[0] ? (
                        <img 
                          src={listing.images[0].filePath} 
                          alt={listing.images[0].altText}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {listing.school?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {!listing.isFree && listing.price && (
                            <Badge variant="secondary" className="text-xs">
                              €{listing.price}
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(listing.status)} text-white border-transparent`}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(listing.status)}
                              {listing.status}
                            </span>
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          0 views
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          0 favorites
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageCircle className="h-3 w-3" />
                          0 messages
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Link to={`/marketplace/listings/${listing.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Link to={`/marketplace/listings/${listing.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                
                {listings.length > 5 && (
                  <div className="text-center pt-4 border-t">
                    <Link to="/marketplace/my-listings">
                      <Button variant="outline" size="sm">
                        View All {listings.length} Listings
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips for Success */}
      {listings.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tips for Successful Selling</CardTitle>
            <CardDescription>
              Get the most out of your listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Camera className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Great Photos</h4>
                  <p className="text-sm text-muted-foreground">
                    Take clear, well-lit photos from multiple angles
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Detailed Descriptions</h4>
                  <p className="text-sm text-muted-foreground">
                    Include size, condition, and any special features
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Euro className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Fair Pricing</h4>
                  <p className="text-sm text-muted-foreground">
                    Research similar items to set competitive prices
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}