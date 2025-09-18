import React, { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Plus,
  Search, 
  Heart,
  MessageCircle,
  Eye,
  Edit,
  Trash2,
  Package,
  School,
  MapPin,
  Calendar,
  Euro,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Target,
  Users,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { EnhancedSchoolSelector } from '@/components/ui/enhanced-school-selector';

export const Route = createFileRoute('/marketplace/requests')(
  {
    component: RequestsPage,
  }
);

function RequestsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('my-requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Create request form state
  const [createForm, setCreateForm] = useState({
    productTypeId: '',
    schoolId: '',
    size: '',
    conditionPreference: '',
    description: '',
    maxPrice: ''
  });
  
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
  
  // Fetch user's requests
  const { data: myRequestsData, isLoading: myRequestsLoading, refetch: refetchMyRequests } = useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const response = await fetch('/api/requests?includeOwn=true', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      return response.json();
    },
    enabled: !!session?.user,
  });
  
  // Fetch public requests (others looking for items)
  const { data: publicRequestsData, isLoading: publicRequestsLoading } = useQuery({
    queryKey: ['public-requests', searchQuery, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (sortBy) params.set('sortBy', sortBy);
      
      const response = await fetch(`/api/requests?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch public requests');
      return response.json();
    },
    enabled: !!session?.user,
  });
  
  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Request created successfully!');
      setShowCreateForm(false);
      setCreateForm({ productTypeId: '', schoolId: '', size: '', conditionPreference: '', description: '', maxPrice: '' });
      refetchMyRequests();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  
  // Delete request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete request');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Request deleted');
      refetchMyRequests();
    },
    onError: (error: Error) => {
      toast.error('Failed to delete request');
    }
  });
  
  const myRequests = myRequestsData?.requests || [];
  const publicRequests = publicRequestsData?.requests || [];
  
  const handleCreateRequest = () => {
    if (!createForm.productTypeId) {
      toast.error('Please select a product type');
      return;
    }
    
    const requestData = {
      ...createForm,
      maxPrice: createForm.maxPrice ? parseFloat(createForm.maxPrice) : undefined
    };
    
    createRequestMutation.mutate(requestData);
  };
  
  const handleDeleteRequest = (requestId: string, description: string) => {
    if (confirm(`Delete request: "${description}"?`)) {
      deleteRequestMutation.mutate(requestId);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500';
      case 'fulfilled':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Target className="h-3 w-3" />;
      case 'fulfilled':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'closed':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };
  
  const RequestCard = ({ request, isOwner = false }: { request: any, isOwner?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium">
                Looking for: {request.productType?.name}
              </h3>
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(request.status)} text-white border-transparent`}
              >
                <span className="flex items-center gap-1">
                  {getStatusIcon(request.status)}
                  {request.status}
                </span>
              </Badge>
            </div>
            
            {request.school && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                <School className="h-3 w-3" />
                <span>{request.school.name}</span>
              </div>
            )}
            
            {request.locality && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span>{request.locality.name}, {request.county?.name}</span>
              </div>
            )}
            
            {request.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {request.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {request.size && (
                <span>Size: {request.size}</span>
              )}
              {request.conditionPreference && (
                <span>Condition: {request.conditionPreference}</span>
              )}
              {request.maxPrice && (
                <span className="flex items-center gap-1">
                  <Euro className="h-3 w-3" />
                  Up to €{request.maxPrice}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(request.createdAt).toLocaleDateString()}
              </div>
              {request.matchCount > 0 && (
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {request.matchCount} matches
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-4">
            {!request.maxPrice && (
              <Badge className="bg-green-500 text-xs">FREE</Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <Link to={`/marketplace/requests/${request.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteRequest(request.id, request.description || request.productType?.name || 'this request')}
                  disabled={deleteRequestMutation.isPending}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Contact
                </Button>
                <Link to={`/marketplace/create?prefill=${encodeURIComponent(JSON.stringify({ productTypeId: request.productTypeId, schoolId: request.schoolId }))}`}>
                  <Button size="sm">
                    <Package className="h-3 w-3 mr-1" />
                    I have this
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-500" />
              Uniform Requests
            </h1>
            <p className="text-muted-foreground">
              Find what you need or help others by posting requests
            </p>
          </div>
        </div>
        
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Request
        </Button>
      </div>
      
      {/* Create Request Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create a New Request</CardTitle>
            <CardDescription>
              Let other parents know what uniform items you're looking for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Product Type *</Label>
                <Select 
                  value={createForm.productTypeId} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, productTypeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category: any) => 
                      category.productTypes?.map((type: any) => (
                        <SelectItem key={type.id} value={type.id}>
                          {category.name} - {type.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Size</Label>
                <Input
                  value={createForm.size}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="e.g., Age 7-8, Size 10, Medium"
                />
              </div>
            </div>
            
            <EnhancedSchoolSelector
              selectedSchoolId={createForm.schoolId}
              onSchoolChange={(schoolId) => setCreateForm(prev => ({ ...prev, schoolId: schoolId || '' }))}
              label="School (optional)"
              placeholder="Which school is this for?"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Preferred Condition</Label>
                <Select 
                  value={createForm.conditionPreference} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, conditionPreference: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any condition</SelectItem>
                    {conditions?.map((condition: any) => (
                      <SelectItem key={condition.id} value={condition.name}>
                        {condition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Maximum Price (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createForm.maxPrice}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, maxPrice: e.target.value }))}
                  placeholder="Leave blank for any price"
                />
              </div>
            </div>
            
            <div>
              <Label>Additional Details</Label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Any specific requirements, preferred brands, etc."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRequest}
                disabled={createRequestMutation.isPending || !createForm.productTypeId}
              >
                {createRequestMutation.isPending ? 'Creating...' : 'Create Request'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            My Requests ({myRequests.length})
          </TabsTrigger>
          <TabsTrigger value="community-requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Community Requests
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-requests" className="mt-6">
          {myRequestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : myRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first request to let other parents know what you're looking for.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myRequests.map((request: any) => (
                <RequestCard key={request.id} request={request} isOwner={true} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="community-requests" className="mt-6">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
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
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="price_low">Budget: Low to High</SelectItem>
                    <SelectItem value="price_high">Budget: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {publicRequestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : publicRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No requests found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search terms.' : 'No one is currently looking for uniform items.'}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {publicRequests.map((request: any) => (
                <RequestCard key={request.id} request={request} isOwner={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
