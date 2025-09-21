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
import { Search, X, Plus, AlertTriangle, CheckCircle, School, Building, MapPin, ExternalLink, Info } from 'lucide-react';
import { getCounties, getLocalities, getLocalitiesByCounty, type County as FallbackCounty, type Locality as FallbackLocality } from '@/data/irish-geographic-data';

interface School {
  id: string;
  name: string;
  address?: string;
  county?: string;
  type?: string;
  level?: 'primary' | 'secondary' | 'mixed';
  website?: string;
  phone?: string;
  email?: string;
  localityId?: string;
  countyId?: string;
}

interface County {
  id: string;
  name: string;
}

interface Locality {
  id: string;
  name: string;
  countyId: string;
}

interface EnhancedSchoolSelectorProps {
  selectedSchoolId?: string;
  onSchoolChange: (schoolId: string | null, schoolData?: School) => void;
  allowSubmission?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
}

export function EnhancedSchoolSelector({ 
  selectedSchoolId,
  onSchoolChange,
  allowSubmission = true,
  required = false,
  className = '',
  label = 'School',
  placeholder = 'Search for your school...'
}: EnhancedSchoolSelectorProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  
  // School submission form state
  const [submissionForm, setSubmissionForm] = useState({
    schoolName: '',
    address: '',
    countyId: '',
    localityId: '',
    level: '' as 'primary' | 'secondary' | 'mixed' | '',
    website: '',
    phone: '',
    email: '',
    submissionReason: '',
    additionalNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Current selection
  const selectedSchool = schools.find(s => s.id === selectedSchoolId);

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

  const fetchGeographicData = async () => {
    try {
      // Fetch counties and localities from your API
      const [countiesResponse, localitiesResponse] = await Promise.all([
        fetch('/api/counties'),
        fetch('/api/localities')
      ]);

      let countiesLoaded = false;
      let localitiesLoaded = false;

      if (countiesResponse.ok) {
        const countiesData = await countiesResponse.json();
        if (countiesData.success) {
          setCounties(countiesData.counties);
          countiesLoaded = true;
        }
      }

      if (localitiesResponse.ok) {
        const localitiesData = await localitiesResponse.json();
        if (localitiesData.success) {
          setLocalities(localitiesData.localities);
          localitiesLoaded = true;
        }
      }

      // If API calls failed, use fallback data
      if (!countiesLoaded) {
        console.warn('Using fallback data for counties');
        setCounties(getCounties());
      }

      if (!localitiesLoaded) {
        console.warn('Using fallback data for localities');
        setLocalities(getLocalities());
      }

    } catch (error) {
      console.error('Error fetching geographic data, using fallback data:', error);
      // Use fallback data when API calls fail
      setCounties(getCounties());
      setLocalities(getLocalities());
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchGeographicData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchools(searchQuery || undefined, selectedCounty || undefined);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCounty]);

  const handleSchoolSelect = (school: School) => {
    onSchoolChange(school.id, school);
  };

  const resetSubmissionForm = () => {
    setSubmissionForm({
      schoolName: '',
      address: '',
      countyId: '',
      localityId: '',
      level: '',
      website: '',
      phone: '',
      email: '',
      submissionReason: '',
      additionalNotes: ''
    });
  };

  const handleSubmitSchool = async () => {
    if (!submissionForm.schoolName.trim() || !submissionForm.address.trim() ||
        !submissionForm.level || !submissionForm.submissionReason.trim()) {
      toast.error('Please fill in all required fields (School Name, Address, Level, and Reason)');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/school-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submissionForm)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('School submission sent successfully! You\'ll be notified when it\'s approved.');
        setShowSubmissionDialog(false);
        resetSubmissionForm();
      } else if (data.suggestion) {
        // Show suggestion for similar school
        toast.error(data.error);
        // You could implement a suggestion dialog here
      } else {
        toast.error(data.error || 'Failed to submit school');
      }
    } catch (error) {
      console.error('Error submitting school:', error);
      toast.error('Failed to submit school');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLocalities = localities.filter(l => 
    !submissionForm.countyId || l.countyId === submissionForm.countyId
  );

  const countyName = (countyId: string) => counties.find(c => c.id === countyId)?.name;

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {allowSubmission && (
            <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add School
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit a New School</DialogTitle>
                  <DialogDescription>
                    Can't find your school? Submit it for admin review and we'll add it to our database.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schoolName">School Name *</Label>
                      <Input
                        id="schoolName"
                        value={submissionForm.schoolName}
                        onChange={(e) => setSubmissionForm({...submissionForm, schoolName: e.target.value})}
                        placeholder="e.g., St. Mary's Primary School"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="level">School Level *</Label>
                      <Select value={submissionForm.level} onValueChange={(value) => setSubmissionForm({...submissionForm, level: value as any})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary School</SelectItem>
                          <SelectItem value="secondary">Secondary School</SelectItem>
                          <SelectItem value="mixed">Mixed (Primary & Secondary)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">School Address *</Label>
                    <Textarea
                      id="address"
                      value={submissionForm.address}
                      onChange={(e) => setSubmissionForm({...submissionForm, address: e.target.value})}
                      placeholder="Full address of the school..."
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="county">County</Label>
                      <Select value={submissionForm.countyId} onValueChange={(value) => setSubmissionForm({...submissionForm, countyId: value, localityId: ''})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select county (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {counties.length > 0 ? counties.map((county) => (
                            <SelectItem key={county.id} value={county.id}>
                              {county.name}
                            </SelectItem>
                          )) : (
                            <SelectItem value="no-counties" disabled>
                              No counties available - please include county in address
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional - you can include the county in the address field instead
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="locality">Locality/Town</Label>
                      <Select value={submissionForm.localityId} onValueChange={(value) => setSubmissionForm({...submissionForm, localityId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select locality (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredLocalities.length > 0 ? filteredLocalities.map((locality) => (
                            <SelectItem key={locality.id} value={locality.id}>
                              {locality.name}
                            </SelectItem>
                          )) : (
                            <SelectItem value="no-localities" disabled>
                              No localities available - please include town in address
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional - you can include the town/locality in the address field instead
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={submissionForm.website}
                        onChange={(e) => setSubmissionForm({...submissionForm, website: e.target.value})}
                        placeholder="https://school-website.ie"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={submissionForm.phone}
                        onChange={(e) => setSubmissionForm({...submissionForm, phone: e.target.value})}
                        placeholder="+353 XX XXX XXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={submissionForm.email}
                      onChange={(e) => setSubmissionForm({...submissionForm, email: e.target.value})}
                      placeholder="info@school.ie"
                    />
                  </div>

                  <div>
                    <Label htmlFor="submissionReason">Why are you adding this school? *</Label>
                    <Textarea
                      id="submissionReason"
                      value={submissionForm.submissionReason}
                      onChange={(e) => setSubmissionForm({...submissionForm, submissionReason: e.target.value})}
                      placeholder="e.g., I'm looking to sell my child's uniform from this school..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="additionalNotes">Additional Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      value={submissionForm.additionalNotes}
                      onChange={(e) => setSubmissionForm({...submissionForm, additionalNotes: e.target.value})}
                      placeholder="Any additional information about the school..."
                      rows={2}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2 text-blue-800">
                      <Info className="h-4 w-4 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Review Process</p>
                        <p className="text-blue-700">
                          Your school submission will be reviewed by our admin team. You'll receive an email notification once it's approved or if we need more information.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowSubmissionDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitSchool}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit School'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Current selection */}
        {selectedSchool && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <School className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">{selectedSchool.name}</h4>
                    {selectedSchool.level && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedSchool.level}
                      </Badge>
                    )}
                  </div>
                  {selectedSchool.address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{selectedSchool.address}</span>
                    </div>
                  )}
                  {selectedSchool.website && (
                    <div className="mt-2">
                      <a 
                        href={selectedSchool.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit website
                      </a>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onSchoolChange(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* School search and selection */}
        {!selectedSchool && (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={placeholder}
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
                  <SelectItem value="all">All counties</SelectItem>
                  {counties.map(county => (
                    <SelectItem key={county.id} value={county.name}>{county.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="text-center py-6 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  Loading schools...
                </div>
              ) : schools.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="mx-auto h-8 w-8 mb-3" />
                  <p className="font-medium">No schools found</p>
                  <p className="text-sm">Try adjusting your search or add a new school</p>
                </div>
              ) : (
                schools.map(school => (
                  <div
                    key={school.id}
                    className="p-3 border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => handleSchoolSelect(school)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{school.name}</h4>
                        {school.address && (
                          <p className="text-sm text-muted-foreground">{school.address}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {school.level && (
                            <Badge variant="outline" className="text-xs">
                              {school.level}
                            </Badge>
                          )}
                          {school.county && (
                            <Badge variant="secondary" className="text-xs">
                              {school.county}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}