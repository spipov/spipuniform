import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  School,
  MapPin,
  ExternalLink,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface School {
  id: string;
  name: string;
  address?: string;
  county?: string;
  level?: 'primary' | 'secondary' | 'mixed';
  website?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SchoolSubmission {
  id: string;
  schoolName: string;
  address: string;
  countyId?: string;
  localityId?: string;
  level: 'primary' | 'secondary' | 'mixed';
  website?: string;
  phone?: string;
  email?: string;
  submissionReason: string;
  additionalNotes?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  submittedBy?: string;
}

export const Route = createFileRoute('/dashboard/spipuniform/schools')({
  component: SchoolsManagement,
});

function SchoolsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const queryClient = useQueryClient();

  // Fetch schools
  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const response = await fetch('/api/schools');
      if (!response.ok) throw new Error('Failed to fetch schools');
      const data = await response.json();
      return data.schools || [];
    },
  });

  // Fetch school submissions
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['school-submissions'],
    queryFn: async () => {
      const response = await fetch('/api/school-submissions');
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      return data.submissions || [];
    },
  });

  // Filter schools based on search and status
  const filteredSchools = schools.filter((school: School) => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && school.isActive) ||
                         (statusFilter === 'inactive' && !school.isActive);
    return matchesSearch && matchesStatus;
  });

  // Approve school submission
  const approveSubmission = useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetch(`/api/school-submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to approve submission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School submission approved');
    },
    onError: () => {
      toast.error('Failed to approve submission');
    },
  });

  // Reject school submission
  const rejectSubmission = useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetch(`/api/school-submissions/${submissionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to reject submission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-submissions'] });
      toast.success('School submission rejected');
    },
    onError: () => {
      toast.error('Failed to reject submission');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSchoolStatusBadge = (isActive: boolean) => {
    return isActive ?
      <Badge variant="default" className="bg-green-500">Active</Badge> :
      <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schools Management</h1>
          <p className="text-muted-foreground">
            Manage schools and review school submissions from users
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools.length}</div>
            <p className="text-xs text-muted-foreground">Active schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter((s: SchoolSubmission) => s.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter((s: SchoolSubmission) => s.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter((s: SchoolSubmission) => s.status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Schools List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Schools</CardTitle>
              <CardDescription>
                Manage existing schools in the system
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {schoolsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No schools found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSchools.map((school: School) => (
                <div key={school.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <School className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">{school.name}</h4>
                      {getSchoolStatusBadge(school.isActive)}
                    </div>
                    {school.address && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3" />
                        <span>{school.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {school.level && <Badge variant="outline">{school.level}</Badge>}
                      {school.county && <span>County: {school.county}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {school.website && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={school.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSchool(school)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* School Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>School Submissions</CardTitle>
          <CardDescription>
            Review and approve school submissions from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No school submissions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission: SchoolSubmission) => (
                <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{submission.schoolName}</h4>
                      {getStatusBadge(submission.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {submission.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reason: {submission.submissionReason}
                    </p>
                  </div>
                  {submission.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rejectSubmission.mutate(submission.id)}
                        disabled={rejectSubmission.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveSubmission.mutate(submission.id)}
                        disabled={approveSubmission.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* School Detail Dialog */}
      <Dialog open={!!selectedSchool} onOpenChange={() => setSelectedSchool(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>School Details</DialogTitle>
            <DialogDescription>
              View detailed information about this school
            </DialogDescription>
          </DialogHeader>
          {selectedSchool && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm">{selectedSchool.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Level</Label>
                  <p className="text-sm">{selectedSchool.level || 'Not specified'}</p>
                </div>
              </div>
              {selectedSchool.address && (
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm">{selectedSchool.address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedSchool.website && (
                  <div>
                    <Label className="text-sm font-medium">Website</Label>
                    <p className="text-sm">
                      <a href={selectedSchool.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedSchool.website}
                      </a>
                    </p>
                  </div>
                )}
                {selectedSchool.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm">{selectedSchool.phone}</p>
                  </div>
                )}
              </div>
              {selectedSchool.email && (
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedSchool.email}</p>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(selectedSchool.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedSchool(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}