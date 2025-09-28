import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Eye, MapPin, School, User } from 'lucide-react';

export const Route = createFileRoute('/dashboard/requests')({
  component: RequestsPage,
});

interface SchoolSetupRequest {
  id: string;
  userId: string;
  countyId: string;
  localityId: string;
  schoolType: 'primary' | 'secondary';
  selectedSchoolId?: string;
  customSchoolName?: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  denialReason?: string;
  nextSteps?: string;
  createdAt: string;
  updatedAt: string;
}

function RequestsPage() {
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['school-setup-requests'],
    queryFn: async () => {
      const response = await fetch('/api/school-setup-requests');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      return data.requests as SchoolSetupRequest[];
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSchoolTypeBadge = (schoolType: string) => {
    return (
      <Badge variant="outline">
        {schoolType === 'primary' ? 'Primary' : 'Secondary'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">School Setup Requests</h1>
          <p className="text-muted-foreground">Manage requests to set up schools in the marketplace</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">School Setup Requests</h1>
          <p className="text-muted-foreground">Manage requests to set up schools in the marketplace</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <span>Failed to load requests. Please try again.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const processedRequests = requests?.filter(r => r.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">School Setup Requests</h1>
        <p className="text-muted-foreground">Manage requests to set up schools in the marketplace</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests?.filter(r => r.status === 'approved').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {requests?.filter(r => r.status === 'denied').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Requests ({pendingRequests.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">School Setup Request</CardTitle>
                    {getStatusBadge(request.status)}
                  </div>
                  <CardDescription>
                    Submitted {formatDate(request.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Request for {request.schoolType} school</span>
                  </div>

                  {request.selectedSchoolId && (
                    <div className="flex items-center space-x-2 text-sm">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span>Existing school selected</span>
                    </div>
                  )}

                  {request.customSchoolName && (
                    <div className="flex items-center space-x-2 text-sm">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span>Custom: {request.customSchoolName}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>User ID: {request.userId}</span>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    <Button size="sm" variant="default" className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1">
                      <XCircle className="h-4 w-4 mr-1" />
                      Deny
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Activity ({processedRequests.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {processedRequests.slice(0, 6).map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">School Setup Request</CardTitle>
                    {getStatusBadge(request.status)}
                  </div>
                  <CardDescription>
                    {request.reviewedAt
                      ? `Processed ${formatDate(request.reviewedAt)}`
                      : `Submitted ${formatDate(request.createdAt)}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Request for {request.schoolType} school</span>
                  </div>

                  {request.selectedSchoolId && (
                    <div className="flex items-center space-x-2 text-sm">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span>Existing school selected</span>
                    </div>
                  )}

                  {request.customSchoolName && (
                    <div className="flex items-center space-x-2 text-sm">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span>Custom: {request.customSchoolName}</span>
                    </div>
                  )}

                  {request.adminNotes && (
                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      <strong>Note:</strong> {request.adminNotes}
                    </div>
                  )}

                  <Button size="sm" variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!requests || requests.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No requests yet</h3>
            <p className="text-muted-foreground">
              When parents request school setups, they'll appear here for review.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
