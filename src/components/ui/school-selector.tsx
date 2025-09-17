import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Search, X, Plus, AlertTriangle, CheckCircle, School, Building } from 'lucide-react';

interface School {
  id: string;
  name: string;
  address: string;
  county: string;
  type: string;
  uniformShop?: string;
  website?: string;
}

interface SchoolSelectorProps {
  primarySchoolId?: string;
  additionalSchools?: string[];
  onSchoolsChange: (primary: string | null, additional: string[]) => void;
  className?: string;
}

const MAX_SCHOOLS_WITHOUT_APPROVAL = 3;

export function SchoolSelector({ 
  primarySchoolId, 
  additionalSchools = [], 
  onSchoolsChange,
  className = ''
}: SchoolSelectorProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  
  // Request additional schools state
  const [requestSchools, setRequestSchools] = useState<string[]>([]);
  const [requestReason, setRequestReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Current selections
  const currentPrimary = primarySchoolId || '';
  const currentAdditional = additionalSchools;
  const totalSelected = [currentPrimary, ...currentAdditional].filter(Boolean).length;

  const fetchSchools = async (query?: string, county?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (county) params.append('county', county);
      params.append('limit', '100');

      const response = await fetch(`/api/schools?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setSchools(data.schools);
      } else {
        toast.error('Failed to load schools');
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchools(searchQuery || undefined, selectedCounty || undefined);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCounty]);

  const handlePrimarySchoolChange = (schoolId: string) => {
    // Remove from additional if it was there
    const newAdditional = currentAdditional.filter(id => id !== schoolId);
    onSchoolsChange(schoolId, newAdditional);
  };

  const handleAdditionalSchoolToggle = (schoolId: string, checked: boolean) => {
    if (checked) {
      // Check if we're at the limit
      if (totalSelected >= MAX_SCHOOLS_WITHOUT_APPROVAL) {
        toast.error(`Cannot select more than ${MAX_SCHOOLS_WITHOUT_APPROVAL} schools without approval`);
        return;
      }
      
      // Remove from primary if it was there, and add to additional
      const newPrimary = currentPrimary === schoolId ? '' : currentPrimary;
      const newAdditional = [...currentAdditional, schoolId];
      onSchoolsChange(newPrimary, newAdditional);
    } else {
      // Remove from additional
      const newAdditional = currentAdditional.filter(id => id !== schoolId);
      onSchoolsChange(currentPrimary, newAdditional);
    }
  };

  const handleRequestAdditionalSchools = async () => {
    if (requestSchools.length === 0) {
      toast.error('Please select at least one school to request');
      return;
    }

    if (!requestReason.trim()) {
      toast.error('Please provide a reason for requesting additional schools');
      return;
    }

    setSubmittingRequest(true);
    try {
      const response = await fetch('/api/school-approval-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          requestedSchools: requestSchools,
          reason: requestReason
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('School approval request submitted successfully');
        setShowRequestDialog(false);
        setRequestSchools([]);
        setRequestReason('');
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting school request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const getSelectedSchoolNames = (): string[] => {
    const selectedIds = [currentPrimary, ...currentAdditional].filter(Boolean);
    return selectedIds.map(id => {
      const school = schools.find(s => s.id === id);
      return school?.name || 'Unknown School';
    });
  };

  const counties = [...new Set(schools.map(s => s.county))].sort();

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            School Selection
          </CardTitle>
          <CardDescription>
            Select up to {MAX_SCHOOLS_WITHOUT_APPROVAL} schools. For additional schools, submit an approval request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current selection summary */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">
                Selected: {totalSelected}/{MAX_SCHOOLS_WITHOUT_APPROVAL} schools
              </p>
              {totalSelected > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {getSelectedSchoolNames().join(', ')}
                </p>
              )}
            </div>
            {totalSelected >= MAX_SCHOOLS_WITHOUT_APPROVAL && (
              <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Request More
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Request Additional Schools</DialogTitle>
                    <DialogDescription>
                      You've reached the limit of {MAX_SCHOOLS_WITHOUT_APPROVAL} schools. Request approval for additional schools.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select additional schools to request</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                        {schools.filter(school => 
                          ![currentPrimary, ...currentAdditional].includes(school.id)
                        ).map(school => (
                          <div key={school.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`request-${school.id}`}
                              checked={requestSchools.includes(school.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setRequestSchools([...requestSchools, school.id]);
                                } else {
                                  setRequestSchools(requestSchools.filter(id => id !== school.id));
                                }
                              }}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={`request-${school.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {school.name}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {school.address}, {school.county}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reason">Reason for requesting additional schools</Label>
                      <Textarea
                        id="reason"
                        placeholder="Please explain why you need access to additional schools..."
                        value={requestReason}
                        onChange={(e) => setRequestReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowRequestDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRequestAdditionalSchools}
                      disabled={submittingRequest || requestSchools.length === 0}
                    >
                      {submittingRequest ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Search and filter */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCounty} onValueChange={setSelectedCounty}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by county" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All counties</SelectItem>
                {counties.map(county => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* School list */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                Loading schools...
              </div>
            ) : schools.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="mx-auto h-12 w-12 mb-4" />
                <p>No schools found</p>
                <p className="text-sm">Try adjusting your search criteria</p>
              </div>
            ) : (
              schools.map(school => {
                const isPrimary = currentPrimary === school.id;
                const isAdditional = currentAdditional.includes(school.id);
                const isSelected = isPrimary || isAdditional;

                return (
                  <div
                    key={school.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-2 mt-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                id={`primary-${school.id}`}
                                name="primarySchool"
                                checked={isPrimary}
                                onChange={() => handlePrimarySchoolChange(school.id)}
                                className="radio"
                                disabled={totalSelected >= MAX_SCHOOLS_WITHOUT_APPROVAL && !isSelected}
                              />
                              <Label htmlFor={`primary-${school.id}`} className="text-xs">
                                Primary
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`additional-${school.id}`}
                                checked={isAdditional}
                                onCheckedChange={(checked) => 
                                  handleAdditionalSchoolToggle(school.id, checked as boolean)
                                }
                                disabled={totalSelected >= MAX_SCHOOLS_WITHOUT_APPROVAL && !isSelected}
                              />
                              <Label htmlFor={`additional-${school.id}`} className="text-xs">
                                Additional
                              </Label>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{school.name}</h4>
                            <p className="text-sm text-muted-foreground">{school.address}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {school.county}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {school.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex flex-col items-end gap-1">
                          {isPrimary && <Badge className="text-xs">Primary</Badge>}
                          {isAdditional && <Badge variant="secondary" className="text-xs">Additional</Badge>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalSelected >= MAX_SCHOOLS_WITHOUT_APPROVAL && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">School limit reached</p>
                <p className="text-yellow-700">
                  You've selected the maximum of {MAX_SCHOOLS_WITHOUT_APPROVAL} schools. To add more schools, 
                  submit an approval request which will be reviewed by our admin team.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}