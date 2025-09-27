import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Clock, Eye, User, FileText, MessageSquare } from "lucide-react";

interface Report {
  id: string;
  reporterUserId: string;
  listingId?: string;
  requestId?: string;
  reason: string;
  description?: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt?: string;
  handledBy?: string;
  handlerNotes?: string;
  reporterName?: string;
  reporterEmail?: string;
  listingTitle?: string;
  requestDescription?: string;
}

const reasonLabels = {
  spam: 'Spam',
  inappropriate: 'Inappropriate Content',
  scam: 'Scam/Fraud',
  harassment: 'Harassment',
  fake: 'Fake Listing',
  other: 'Other'
};

const statusConfig = {
  open: { label: 'Open', variant: 'destructive' as const, icon: AlertTriangle },
  reviewing: { label: 'Reviewing', variant: 'secondary' as const, icon: Clock },
  resolved: { label: 'Resolved', variant: 'default' as const, icon: CheckCircle },
  dismissed: { label: 'Dismissed', variant: 'outline' as const, icon: CheckCircle }
};

export function ReportManagementDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [handlerNotes, setHandlerNotes] = useState("");
  const [newStatus, setNewStatus] = useState<Report['status']>('open');

  // Fetch all reports
  const fetchReports = async (status?: string) => {
    try {
      const url = status ? `/api/reports?status=${status}` : '/api/reports';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusUpdate = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports?id=${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          handlerNotes: handlerNotes || undefined
        })
      });

      if (!response.ok) throw new Error('Failed to update report');

      toast.success('Report updated successfully');
      setSelectedReport(null);
      setHandlerNotes("");
      setNewStatus('open');
      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    }
  };

  const getStatusBadge = (status: Report['status']) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const openReports = reports.filter(r => r.status === 'open');
  const reviewingReports = reports.filter(r => r.status === 'reviewing');
  const resolvedReports = reports.filter(r => r.status === 'resolved');
  const dismissedReports = reports.filter(r => r.status === 'dismissed');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Report Management Dashboard</h2>
          <p className="text-gray-600">Manage user reports and content moderation</p>
        </div>
        <Button onClick={() => fetchReports()} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="open" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="open" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Open ({openReports.length})
          </TabsTrigger>
          <TabsTrigger value="reviewing" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Reviewing ({reviewingReports.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Resolved ({resolvedReports.length})
          </TabsTrigger>
          <TabsTrigger value="dismissed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Dismissed ({dismissedReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {openReports.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>No open reports</p>
                  <p className="text-sm">All caught up!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {openReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {reasonLabels[report.reason as keyof typeof reasonLabels]}
                            <Badge variant="outline">{report.reason}</Badge>
                          </CardTitle>
                          <CardDescription>
                            Reported by {report.reporterName || report.reporterUserId} • {new Date(report.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {report.description && (
                        <div>
                          <Label className="text-sm font-medium">Description:</Label>
                          <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                            {report.description}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {report.listingTitle && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            Listing: {report.listingTitle}
                          </div>
                        )}
                        {report.requestDescription && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            Request: {report.requestDescription}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Review Report</DialogTitle>
                              <DialogDescription>
                                Review and update the status of this report
                              </DialogDescription>
                            </DialogHeader>

                            {selectedReport && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Report ID:</Label>
                                    <p className="text-sm">{selectedReport.id}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Report Date:</Label>
                                    <p className="text-sm">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Reporter:</Label>
                                    <p className="text-sm">{selectedReport.reporterName || selectedReport.reporterUserId}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Reason:</Label>
                                    <p className="text-sm">{reasonLabels[selectedReport.reason as keyof typeof reasonLabels]}</p>
                                  </div>
                                </div>

                                {selectedReport.description && (
                                  <div>
                                    <Label className="text-sm font-medium">Description:</Label>
                                    <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                                      {selectedReport.description}
                                    </p>
                                  </div>
                                )}

                                <div className="space-y-3">
                                  <Label className="text-sm font-medium">Update Status:</Label>
                                  <Select value={newStatus} onValueChange={(value: Report['status']) => setNewStatus(value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="open">Open</SelectItem>
                                      <SelectItem value="reviewing">Reviewing</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                      <SelectItem value="dismissed">Dismissed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-3">
                                  <Label className="text-sm font-medium">Handler Notes (Optional):</Label>
                                  <Textarea
                                    value={handlerNotes}
                                    onChange={(e) => setHandlerNotes(e.target.value)}
                                    placeholder="Add notes about this report resolution..."
                                    rows={3}
                                  />
                                </div>

                                <div className="flex gap-2 pt-4">
                                  <Button
                                    onClick={() => handleStatusUpdate(selectedReport.id)}
                                    className="flex-1"
                                  >
                                    Update Report
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedReport(null);
                                      setHandlerNotes("");
                                      setNewStatus('open');
                                    }}
                                  >
                                    Cancel
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

        <TabsContent value="reviewing" className="space-y-4">
          {reviewingReports.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <p>No reports under review</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reviewingReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        <div>
                          <CardTitle className="text-lg">{reasonLabels[report.reason as keyof typeof reasonLabels]}</CardTitle>
                          <CardDescription>
                            {report.reporterName || report.reporterUserId} • {new Date(report.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.description && (
                        <p className="text-sm text-gray-600">{report.description}</p>
                      )}
                      {report.handlerNotes && (
                        <div>
                          <Label className="text-sm font-medium">Handler Notes:</Label>
                          <p className="text-sm text-blue-600 mt-1">{report.handlerNotes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedReports.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <p>No resolved reports</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {resolvedReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <CardTitle className="text-lg">{reasonLabels[report.reason as keyof typeof reasonLabels]}</CardTitle>
                          <CardDescription>
                            {report.reporterName || report.reporterUserId} • Resolved {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : 'Unknown'}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.description && (
                        <p className="text-sm text-gray-600">{report.description}</p>
                      )}
                      {report.handlerNotes && (
                        <div>
                          <Label className="text-sm font-medium">Resolution Notes:</Label>
                          <p className="text-sm text-green-600 mt-1">{report.handlerNotes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-4">
          {dismissedReports.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <p>No dismissed reports</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {dismissedReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-gray-500" />
                        <div>
                          <CardTitle className="text-lg">{reasonLabels[report.reason as keyof typeof reasonLabels]}</CardTitle>
                          <CardDescription>
                            {report.reporterName || report.reporterUserId} • Dismissed {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : 'Unknown'}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.description && (
                        <p className="text-sm text-gray-600">{report.description}</p>
                      )}
                      {report.handlerNotes && (
                        <div>
                          <Label className="text-sm font-medium">Notes:</Label>
                          <p className="text-sm text-gray-600 mt-1">{report.handlerNotes}</p>
                        </div>
                      )}
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