import React, { useState } from 'react';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit,
  Trash2,
  Target,
  Package,
  School,
  MapPin,
  Calendar,
  Euro,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  MessageCircle,
  Eye,
  Star,
  Heart,
  Save,
  X,
  TrendingUp,
  Users,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { EnhancedSchoolSelector } from '@/components/ui/enhanced-school-selector';
import { ItemImageGallery } from '@/components/ui/item-image-gallery';

export const Route = createFileRoute('/marketplace/requests/$id')({
  component: RequestDetailPage,
});

function RequestDetailPage() {
  const { id } = Route.useParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    size: '',
    conditionPreference: '',
    description: '',
    maxPrice: ''
  });
  
  // Fetch request details
  const { data: requestData, isLoading, error, refetch } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const response = await fetch(`/api/requests/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Request not found');
        }
        if (response.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error('Failed to fetch request');
      }
      return response.json();
    },
    enabled: !!session?.user,
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
  
  // Update request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Request updated successfully!');
      setIsEditing(false);
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  
  // Delete request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/requests/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete request');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Request deleted');
      router.navigate({ to: '/marketplace/requests' });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete request');
    }
  });
  
  const request = requestData?.request;
  const matches = requestData?.matches || [];
  const isOwner = request?.userId === session?.user?.id;
  
  React.useEffect(() => {
    if (request && isOwner) {
      setEditForm({
        size: request.size || '',
        conditionPreference: request.conditionPreference || '',
        description: request.description || '',
        maxPrice: request.maxPrice ? request.maxPrice.toString() : ''
      });
    }
  }, [request, isOwner]);
  
  const handleUpdateRequest = () => {
    const updateData = {
      ...editForm,
      maxPrice: editForm.maxPrice ? parseFloat(editForm.maxPrice) : undefined
    };
    updateRequestMutation.mutate(updateData);
  };
  
  const handleDeleteRequest = () => {
    if (confirm(`Delete this request? This action cannot be undone.`)) {
      deleteRequestMutation.mutate();
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
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/marketplace/requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {error.message === 'Request not found' ? 'Request Not Found' : 'Access Denied'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {error.message === 'Request not found' 
                ? 'This request may have been deleted or never existed.'
                : 'You do not have permission to view this request.'
              }
            </p>
            <Link to="/marketplace/requests">
              <Button>
                View All Requests
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/marketplace/requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </Link>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (!request) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/marketplace/requests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-500" />
              Request Details
            </h1>
            <p className="text-muted-foreground">
              {isOwner ? 'Manage your request' : 'View request details'}
            </p>
          </div>
        </div>
        
        {isOwner && (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDeleteRequest}
                  disabled={deleteRequestMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateRequest}
                  disabled={updateRequestMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateRequestMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Request Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 mb-2">
                    Looking for: {request.productType?.name}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(request.status)} text-white border-transparent`}
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </Badge>
                  </CardTitle>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {request.school && (
                      <div className="flex items-center gap-1">
                        <School className="h-4 w-4" />
                        <span>{request.school.name}</span>
                      </div>
                    )}
                    
                    {request.locality && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{request.locality.name}, {request.county?.name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created {new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {!isOwner && request.user && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Requested by {request.user.profile?.displayName || 'Anonymous'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {request.size && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="font-medium text-sm">Size</div>
                        <div>{request.size}</div>
                      </div>
                    )}
                    
                    {request.conditionPreference && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="font-medium text-sm">Preferred Condition</div>
                        <div>{request.conditionPreference}</div>
                      </div>
                    )}
                    
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-medium text-sm">Budget</div>
                      <div className="flex items-center gap-1">
                        {request.maxPrice ? (
                          <>
                            <Euro className="h-4 w-4" />
                            Up to €{request.maxPrice}
                          </>
                        ) : (
                          <Badge className="bg-green-500">Any price / FREE</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {request.description && (
                    <div>
                      <h3 className="font-medium mb-2">Additional Details</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {request.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Size</Label>
                      <Input
                        value={editForm.size}
                        onChange={(e) => setEditForm(prev => ({ ...prev, size: e.target.value }))}
                        placeholder="e.g., Age 7-8, Size 10, Medium"
                      />
                    </div>
                    
                    <div>
                      <Label>Preferred Condition</Label>
                      <Select 
                        value={editForm.conditionPreference} 
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, conditionPreference: value }))}
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
                        value={editForm.maxPrice}
                        onChange={(e) => setEditForm(prev => ({ ...prev, maxPrice: e.target.value }))}
                        placeholder="Leave blank for any price"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Additional Details</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Any specific requirements, preferred brands, etc."
                      rows={4}
                    />
                  </div>
                </div>
              )}
              
              {!isOwner && (
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Requester
                  </Button>
                  <Link to={`/marketplace/create?prefill=${encodeURIComponent(JSON.stringify({ productTypeId: request.productTypeId, schoolId: request.schoolId }))}`}>
                    <Button variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      I have this item
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Matches Section */}
          {matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Potential Matches ({matches.length})
                </CardTitle>
                <CardDescription>
                  Similar items currently available in the marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map((match: any) => (
                    <Card key={match.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {match.listing.images && match.listing.images.length > 0 && (
                            <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={match.listing.images[0].url} 
                                alt={match.listing.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{match.listing.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {match.listing.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {match.listing.size && (
                                  <span>Size: {match.listing.size}</span>
                                )}
                                {match.listing.condition && (
                                  <span>• {match.listing.condition.name}</span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1 font-medium">
                                <Euro className="h-3 w-3" />
                                €{match.listing.price}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-3 pt-3 border-t">
                          <Link to={`/marketplace/listing/${match.listing.id}`}>
                            <Button size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isOwner ? (
                <>
                  <Link to="/marketplace/browse" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="h-4 w-4 mr-2" />
                      Browse Available Items
                    </Button>
                  </Link>
                  <Link to="/marketplace/create" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="h-4 w-4 mr-2" />
                      Create Listing
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Link to={`/marketplace/create?prefill=${encodeURIComponent(JSON.stringify({ productTypeId: request.productTypeId, schoolId: request.schoolId }))}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="h-4 w-4 mr-2" />
                      I have this item
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(request.status)} text-white border-transparent`}>
                    {request.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potential Matches</span>
                  <span>{matches.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                {request.updatedAt !== request.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{new Date(request.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}