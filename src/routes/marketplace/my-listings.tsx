import React, { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Pause,
  Trash2,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Euro,
  MessageCircle,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';

export const Route = createFileRoute('/marketplace/my-listings')(
  {
    component: MyListingsPage,
  }
);

function MyListingsPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const { data: listingsData, isLoading, refetch } = useQuery({
    queryKey: ['user-listings', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      params.set('includeInactive', 'true');
      
      const response = await fetch(`/api/listings?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch listings');
      return response.json();
    },
    enabled: !!session?.user,
  });

  const listings = listingsData?.listings || [];
  
  // Filter listings based on search and status
  const filteredListings = listings.filter((listing: any) => {
    const matchesSearch = !searchQuery || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.school?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || listing.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

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

  const handleToggleStatus = async (listingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Listing ${newStatus === 'active' ? 'activated' : 'paused'}`);
        refetch();
      } else {
        toast.error('Failed to update listing');
      }
    } catch (error) {
      toast.error('Failed to update listing');
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Listing deleted');
        refetch();
      } else {
        toast.error('Failed to delete listing');
      }
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const groupedCounts = listings.reduce((acc: any, listing: any) => {
    acc[listing.status] = (acc[listing.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/marketplace">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">My Listings</h1>
            <p className="text-muted-foreground">
              Manage all your uniform listings
            </p>
          </div>
        </div>
        <Link to="/marketplace/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Listing
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search listings by title or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({groupedCounts.active || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({groupedCounts.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Drafts ({groupedCounts.draft || 0})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired ({groupedCounts.expired || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-lg bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {activeTab === 'all' 
                    ? 'No listings found' 
                    : `No ${activeTab} listings`}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : activeTab === 'all'
                    ? 'Create your first listing to get started'
                    : `You don't have any ${activeTab} listings yet`}
                </p>
                {activeTab === 'all' && (
                  <Link to="/marketplace/create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Listing
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredListings.map((listing: any) => (
                <Card key={listing.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
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
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <Link 
                              to={`/marketplace/listings/${listing.id}`}
                              className="text-lg font-medium hover:underline line-clamp-1"
                            >
                              {listing.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {listing.school?.name}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {!listing.isFree && listing.price && (
                              <Badge variant="secondary" className="text-sm">
                                €{listing.price}
                              </Badge>
                            )}
                            {listing.isFree && (
                              <Badge className="bg-green-500 text-sm">FREE</Badge>
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
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {listing.viewCount || 0} views
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            0 favorites
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            0 messages
                          </div>
                          <span>
                            Listed {new Date(listing.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link to={`/marketplace/listings/${listing.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                          
                          <Link to={`/marketplace/listings/${listing.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          
                          {listing.status === 'active' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleStatus(listing.id, 'paused')}
                            >
                              <Pause className="h-3 w-3 mr-1" />
                              Pause
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleStatus(listing.id, 'active')}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Activate
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(listing.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}