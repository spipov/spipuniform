import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Eye, User, Building } from "lucide-react";

interface SchoolApprovalRequest {
  id: string;
  userId: string;
  currentSchools: string[];
  requestedSchools: string[];
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  denialReason?: string;
  nextSteps?: string;
  approvedSchools?: string[];
  emailsSent?: any;
}

interface School {
  id: string;
  name: string;
  level?: string;
}

interface UserProfile {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export function ShopVerificationDashboard() {
  const [requests, setRequests] = useState<SchoolApprovalRequest[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SchoolApprovalRequest | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [denialReason, setDenialReason] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [approvedSchools, setApprovedSchools] = useState<string[]>([]);

  // Fetch all pending requests
  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/school-approval-requests?admin=true');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load approval requests');
    } finally {
      setLoading(false);
    }
  };

  // Fetch schools for reference
  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/spipuniform/schools');
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchSchools();
  }, []);

  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.name || schoolId;
  };

  const getUserProfile = (userId: string) => {
    return userProfiles.find(p => p.userId === userId);
  };

  const handleApproval = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      const payload: any = {
        action,
        adminNotes: actionNotes
      };

      if (action === 'approve') {
        payload.approvedSchools = approvedSchools.length > 0 ? approvedSchools : selectedRequest?.requestedSchools;
      } else {
        payload.denialReason = denialReason;
        payload.nextSteps = nextSteps;
      }

      const response = await fetch(`/api/school-approval-requests?id=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to process request');

      toast.success(`Request ${action}d successfully`);
      setSelectedRequest(null);
      setActionNotes("");
      setDenialReason("");
      setNextSteps("");
      setApprovedSchools([]);
      fetchRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process request');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      approved: { variant: "default" as const, icon: CheckCircle, label: "Approved" },
      denied: { variant: "destructive" as const, icon: XCircle, label: "Denied" }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading approval requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shop Verification Dashboard</h2>
          <p className="text-gray-600">Manage school approval requests from users</p>
        </div>
        <Button onClick={fetchRequests} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Processed ({processedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>No pending requests</p>
                  <p className="text-sm">All caught up!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <div>
                          <CardTitle className="text-lg">User {request.userId}</CardTitle>
                          <CardDescription>
                            Requested {request.requestedSchools.length} school(s) • {new Date(request.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Requested Schools:</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {request.requestedSchools.map((schoolId) => (
                            <Badge key={schoolId} variant="outline">
                              <Building className="w-3 h-3 mr-1" />
                              {getSchoolName(schoolId)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Reason:</Label>
                        <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Review School Approval Request</DialogTitle>
                              <DialogDescription>
                                Review and approve or deny this school access request
                              </DialogDescription>
                            </DialogHeader>

                            {selectedRequest && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">User ID:</Label>
                                    <p className="text-sm">{selectedRequest.userId}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Request Date:</Label>
                                    <p className="text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Current Schools:</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedRequest.currentSchools.map((schoolId) => (
                                      <Badge key={schoolId} variant="secondary">
                                        {getSchoolName(schoolId)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Requested Schools:</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedRequest.requestedSchools.map((schoolId) => (
                                      <Badge key={schoolId} variant="outline">
                                        {getSchoolName(schoolId)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Reason for Request:</Label>
                                  <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                                    {selectedRequest.reason}
                                  </p>
                                </div>

                                <div className="space-y-3">
                                  <Label className="text-sm font-medium">Admin Notes (Optional):</Label>
                                  <Textarea
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                    placeholder="Add any notes about this decision..."
                                    rows={3}
                                  />
                                </div>

                                <div className="flex gap-2 pt-4">
                                  <Button
                                    onClick={() => handleApproval(selectedRequest.id, 'approve')}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve Request
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleApproval(selectedRequest.id, 'deny')}
                                    className="flex-1"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Deny Request
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {processedRequests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <p>No processed requests yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {processedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <div>
                          <CardTitle className="text-lg">User {request.userId}</CardTitle>
                          <CardDescription>
                            {request.requestedSchools.length} school(s) • {new Date(request.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium">Requested Schools:</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {request.requestedSchools.map((schoolId) => (
                            <Badge key={schoolId} variant="outline">
                              {getSchoolName(schoolId)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {request.adminNotes && (
                        <div>
                          <Label className="text-sm font-medium">Admin Notes:</Label>
                          <p className="text-sm text-gray-600 mt-1">{request.adminNotes}</p>
                        </div>
                      )}

                      {request.denialReason && (
                        <div>
                          <Label className="text-sm font-medium">Denial Reason:</Label>
                          <p className="text-sm text-red-600 mt-1">{request.denialReason}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Processed {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'Unknown'}
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