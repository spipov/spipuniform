import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';

import { toast } from 'sonner';
import { School, MapPin, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { LocalitySearch } from '@/components/shared/locality-search';


// Simple debounce function
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
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

interface OSMLocality {
  id: string;
  name: string;
  placeType: string;
  lat: number;
  lon: number;
  isOSM: boolean;
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

interface School {
  id: string;
  name: string;
  address?: string;
  level: 'primary' | 'secondary';
  countyId: string;
  localityId?: string;
  localityName?: string;
  countyName?: string;
  isActive: boolean;
}

interface SchoolSetupRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SchoolSetupRequestDialog({
  isOpen,
  onClose,
  onSuccess
}: SchoolSetupRequestDialogProps) {
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = useSession();
  const [showAuthDialog, setShowAuthDialog] = useState(false);



  // Gate the dialog immediately on open if unauthenticated
  useEffect(() => {
    if (!isOpen) return;
    if (sessionPending) return;
    const isSignedIn = !!session?.user;
    if (!isSignedIn) {
      setShowAuthDialog(true);
    }
  }, [isOpen, sessionPending, session]);


  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>('');
  const [selectedLocalityName, setSelectedLocalityName] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [customSchoolName, setCustomSchoolName] = useState<string>('');
  const [schoolType, setSchoolType] = useState<'primary' | 'secondary'>('primary');
  const [step, setStep] = useState<'location' | 'school' | 'confirm'>('location');

  // Fetch counties
  const { data: counties } = useQuery({
    queryKey: ['counties'],
    queryFn: async () => {
      const response = await fetch('/api/counties');
      if (!response.ok) throw new Error('Failed to fetch counties');
      const data = await response.json();
      return data.counties as County[];
    }
  });

  // Fetch schools for selected location and type
  const { data: schools } = useQuery({
    queryKey: ['schools-by-location-and-type', selectedCounty, selectedLocalityName, schoolType],
    queryFn: async () => {
      if (!selectedCounty || !selectedLocalityName) return [];

      const params = new URLSearchParams({
        countyId: selectedCounty,
        level: schoolType,
        osmLocalityName: selectedLocalityName, // Use locality name for address matching
        marketplace: 'true',
        schoolSetup: 'true' // Include CSV schools for setup requests
      });

      const response = await fetch(`/api/spipuniform/schools?${params}`);
      if (!response.ok) throw new Error('Failed to fetch schools');
      const data = await response.json();
      return data.schools || [];
    },
    enabled: !!selectedCounty && !!selectedLocalityName
  });

  // Submit school setup request mutation
  const createSchoolSetupRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/school-setup-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit school setup request');
      }
      return response.json();
    },
    onSuccess: (responseData) => {
      const { action, message } = responseData;

      if (action === 'activated') {
        toast.success(message || 'School has been activated and is now available in the marketplace!');
      } else if (action === 'submitted_for_approval') {
        toast.success(message || 'Your school request has been submitted for admin approval.');
      } else {
        toast.success('School setup request submitted successfully!');
      }

      resetForm();
      queryClient.invalidateQueries({ queryKey: ['school-setup-requests'] });
      queryClient.invalidateQueries({ queryKey: ['schools-by-location-and-type'] }); // Refresh school list
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setSelectedCounty('');
    setSelectedLocalityId('');
    setSelectedLocalityName('');
    setSelectedSchool('');
    setCustomSchoolName('');
    setSchoolType('primary');
    setStep('location');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLocationNext = () => {
    if (!selectedCounty || !selectedLocalityName) {
      toast.error('Please select both county and locality');
      return;
    }
    setStep('school');
  };

  const handleSchoolNext = () => {
    if (!selectedSchool && !customSchoolName.trim()) {
      toast.error('Please select a school or enter a custom school name');
      return;
    }
    setStep('confirm');
  };

  const handleSubmitRequest = () => {
    const requestData = {
      countyId: selectedCounty,
      localityName: selectedLocalityName, // Store locality name, not ID
      schoolType,
      selectedSchoolId: selectedSchool || null,
      customSchoolName: customSchoolName.trim() || null,
    };

    createSchoolSetupRequestMutation.mutate(requestData);
  };

  const selectedCountyName = counties?.find(c => c.id === selectedCounty)?.name;
  const selectedSchoolData = schools?.find((s: School) => s.id === selectedSchool);

  return (<>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="marketplace__school-setup-request-dialog sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5 text-blue-500" />
            {selectedSchoolData ? 'Activate School' : 'Request School Setup'}
          </DialogTitle>
          <DialogDescription>
            {selectedSchoolData
              ? 'Activate an existing school to make it available in the marketplace for all parents in your area.'
              : 'Request a new school setup for your area. We\'ll review and activate it to make it available for listings and requests.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className={`flex items-center space-x-2 ${step === 'location' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'location' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Location</span>
            </div>
            <div className={`w-8 h-0.5 ${step !== 'location' ? 'bg-green-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center space-x-2 ${step === 'school' ? 'text-blue-600' : step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'school' ? 'bg-blue-100 text-blue-600' :
                step === 'confirm' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">School</span>
            </div>
            <div className={`w-8 h-0.5 ${step === 'confirm' ? 'bg-green-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center space-x-2 ${step === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'confirm' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>

          {/* Step 1: Location Selection */}
          {step === 'location' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="county">County *</Label>
                <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your county" />
                  </SelectTrigger>
                  <SelectContent>
                    {counties?.map((county) => (
                      <SelectItem key={county.id} value={county.id}>
                        {county.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <LocalitySearch
                countyId={selectedCounty}
                value={selectedLocalityId}
                onChange={(id, name) => {
                  setSelectedLocalityId(id);
                  setSelectedLocalityName(name);
                }}
                label="Town/Locality"
                placeholder="Type to search localities..."
              />

              <div>
                <Label htmlFor="schoolType">School Type *</Label>
                <Select value={schoolType} onValueChange={(value) => setSchoolType(value as 'primary' | 'secondary')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary School</SelectItem>
                    <SelectItem value="secondary">Secondary School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: School Selection */}
          {step === 'school' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2 text-blue-800">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Location: {selectedLocalityName}, {selectedCountyName}</p>
                    <p className="text-blue-700">
                      Now let's find {schoolType} schools in your area.
                    </p>
                  </div>
                </div>
              </div>

              {schools && schools.length > 0 ? (
                <div className="space-y-3">
                  <Label>Available Schools</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {schools.map((school: School) => (
                      <Card
                        key={school.id}
                        className={`cursor-pointer transition-colors ${
                          selectedSchool === school.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSchool(school.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{school.name}</div>
                              {school.address && (
                                <div className="text-sm text-muted-foreground">{school.address}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={school.isActive ? 'default' : 'secondary'}>
                                {school.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                selectedSchool === school.id ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                              }`}>
                                {selectedSchool === school.id && (
                                  <div className="w-full h-full rounded-full bg-white scale-50" />
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No {schoolType} schools found</h3>
                  <p className="text-muted-foreground mb-4">
                    We don't have any {schoolType} schools listed for {selectedLocalityName}, {selectedCountyName} yet.
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label htmlFor="customSchool">Or enter school name manually</Label>
                <Input
                  id="customSchool"
                  value={customSchoolName}
                  onChange={(e) => setCustomSchoolName(e.target.value)}
                  placeholder={`Enter ${schoolType} school name`}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
           {step === 'confirm' && (
             <div className="space-y-4">
               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                 <div className="flex items-start gap-2 text-green-800">
                   <School className="h-4 w-4 mt-0.5" />
                   <div className="text-sm">
                     <p className="font-medium">
                       {selectedSchoolData ? 'School Activation' : 'School Request'}
                     </p>
                     <div className="mt-2 space-y-1">
                       <p><strong>Location:</strong> {selectedLocalityName}, {selectedCountyName}</p>
                       <p><strong>School Type:</strong> {schoolType === 'primary' ? 'Primary' : 'Secondary'}</p>
                       {selectedSchoolData ? (
                         <p><strong>School:</strong> {selectedSchoolData.name} (Existing school)</p>
                       ) : (
                         <p><strong>School:</strong> {customSchoolName} (New school)</p>
                       )}
                     </div>
                   </div>
                 </div>
               </div>

               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                 <div className="flex items-start gap-2 text-blue-800">
                   <AlertCircle className="h-4 w-4 mt-0.5" />
                   <div className="text-sm">
                     <p className="font-medium">What happens next?</p>
                     <p className="text-blue-700 mt-1">
                       {selectedSchoolData ? (
                         <>
                           This school will be automatically activated and immediately available in the marketplace for all parents in your area.
                         </>
                       ) : (
                         <>
                           Your request will be submitted for admin approval. Once approved, the school will be available for all parents in your area to use for listings and requests.
                         </>
                       )}
                     </p>
                   </div>
                 </div>
               </div>
             </div>
           )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>

          {step === 'location' && (
            <Button onClick={handleLocationNext}>
              Next: Select School
            </Button>
          )}

          {step === 'school' && (
            <Button onClick={handleSchoolNext}>
              {selectedSchoolData ? 'Next: Activate School' : 'Next: Confirm Request'}
            </Button>
          )}

          {step === 'confirm' && (
            <Button
              onClick={handleSubmitRequest}
              disabled={createSchoolSetupRequestMutation.isPending}
            >
              {createSchoolSetupRequestMutation.isPending
                ? (selectedSchoolData ? 'Activating...' : 'Submitting...')
                : (selectedSchoolData ? 'Activate School' : 'Submit Request')
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
      <DialogContent className="school-setup__auth-gate-dialog">
        <DialogHeader>
          <DialogTitle>Sign in required</DialogTitle>
          <DialogDescription>
            Sign in to continue with School Setup Request.
          </DialogDescription>
        </DialogHeader>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} onSuccess={() => setShowAuthDialog(false)} />
      </DialogContent>
    </Dialog>
  </>);
}