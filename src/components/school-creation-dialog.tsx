import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, Search, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

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
  localityCount: number;
  schoolCount: number;
}

interface OSMLocality {
  id: string;
  name: string;
  placeType: string;
  lat: number;
  lon: number;
  isOSM: boolean;
}

interface SchoolFormData {
  name: string;
  address: string;
  level: 'primary' | 'secondary' | 'mixed';
  website: string;
  phone: string;
  email: string;
  isActive: boolean;
}

interface SchoolCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SchoolCreationDialog({ open, onOpenChange, onSuccess }: SchoolCreationDialogProps) {
  const [counties, setCounties] = useState<County[]>([]);
  const [osmLocalities, setOSMLocalities] = useState<OSMLocality[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [selectedLocality, setSelectedLocality] = useState<string>('');
  const [localitySearch, setLocalitySearch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // School form state
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    address: '',
    level: 'primary',
    website: '',
    phone: '',
    email: '',
    isActive: true
  });

  // Fetch counties on mount
  const { data: countiesData } = useQuery({
    queryKey: ['counties'],
    queryFn: async () => {
      const response = await fetch('/api/spipuniform/counties');
      const data = await response.json();
      return data.counties || [];
    },
  });

  useEffect(() => {
    if (countiesData) {
      setCounties(countiesData);
    }
  }, [countiesData]);

  const searchLocalities = async (countyId: string, query: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ countyId });
      if (query.trim()) {
        params.append('q', query.trim());
      }

      const response = await fetch(`/api/spipuniform/localities/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setOSMLocalities(data.localities);
      }
    } catch (error) {
      console.error('Error searching localities:', error);
      setOSMLocalities([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedLocalitySearch = useCallback(
    debounce((countyId: string, query: string) => {
      if (countyId) {
        searchLocalities(countyId, query);
      }
    }, 500),
    []
  );

  // Reset when county changes
  useEffect(() => {
    if (selectedCounty) {
      setSelectedLocality('');
      setLocalitySearch('');
      setOSMLocalities([]);
    }
  }, [selectedCounty]);

  // Search localities when search term changes
  useEffect(() => {
    if (selectedCounty) {
      debouncedLocalitySearch(selectedCounty, localitySearch);
    }
  }, [localitySearch, selectedCounty, debouncedLocalitySearch]);

  // Search schools when locality is selected
  useEffect(() => {
    if (selectedLocality && selectedCounty) {
      searchSchoolsInLocality();
    } else {
      setSchools([]);
    }
  }, [selectedLocality, selectedCounty]);

  const searchSchoolsInLocality = async () => {
    try {
      setLoading(true);
      const selectedLocalityData = osmLocalities.find(l => l.id === selectedLocality);

      const params = new URLSearchParams({ countyId: selectedCounty });
      if (selectedLocalityData) {
        params.append('osmLocalityName', selectedLocalityData.name);
      }
      // Include CSV/inactive schools during setup and filter by selected level
      params.set('schoolSetup', 'true');
      if (formData.level) {
        params.set('level', formData.level);
      }

      const response = await fetch(`/api/spipuniform/schools?${params}`);
      const data = await response.json();

      if (data.success) {
        setSchools(data.schools);
      }
    } catch (error) {
      console.error('Error searching schools:', error);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  // Create school mutation
  const createSchool = useMutation({
    mutationFn: async (data: SchoolFormData & { countyId: string; localityId?: string }) => {
      const response = await fetch('/api/spipuniform/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create school');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools-enhanced'] });
      toast.success('School created successfully');
      handleReset();
      onOpenChange(false); // Close the dialog
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Failed to create school');
      console.error('Error creating school:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCounty) {
      toast.error('Please select a county');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a school name');
      return;
    }

    const selectedLocalityData = osmLocalities.find(l => l.id === selectedLocality);

    // If OSM locality is selected and address doesn't already contain it, append it
    let finalAddress = formData.address;
    if (selectedLocalityData && finalAddress && !finalAddress.toLowerCase().includes(selectedLocalityData.name.toLowerCase())) {
      finalAddress = `${finalAddress}, ${selectedLocalityData.name}`;
    } else if (selectedLocalityData && !finalAddress) {
      finalAddress = selectedLocalityData.name;
    }

    createSchool.mutate({
      ...formData,
      address: finalAddress,
      countyId: selectedCounty,
    });
  };

  const handleReset = () => {
    setFormData({
      name: '',
      address: '',
      level: 'primary',
      website: '',
      phone: '',
      email: '',
      isActive: true
    });
    setSelectedCounty('');
    setSelectedLocality('');
    setLocalitySearch('');
    setOSMLocalities([]);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const selectedCountyData = counties.find(c => c.id === selectedCounty);
  const selectedLocalityData = osmLocalities.find(l => l.id === selectedLocality);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="spip-schools__creation-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New School
          </DialogTitle>
          <DialogDescription>
            Add a new school to the system using OSM data verification
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - County & Locality Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="county">County *</Label>
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a county" />
                </SelectTrigger>
                <SelectContent>
                  {counties.map(county => (
                    <SelectItem key={county.id} value={county.id}>
                      {county.name} ({county.schoolCount} schools)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCounty && (
              <div>
                <Label htmlFor="locality-search">Search Localities</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="locality-search"
                    placeholder="Type to search localities... (e.g., Greystones, Arklow)"
                    value={localitySearch}
                    onChange={(e) => setLocalitySearch(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {loading && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching OSM...
                  </div>
                )}

                {localitySearch && osmLocalities.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded">
                    {osmLocalities.map(locality => (
                      <div
                        key={locality.id}
                        className={`p-2 cursor-pointer hover:bg-gray-50 text-sm ${
                          selectedLocality === locality.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setSelectedLocality(locality.id)}
                      >
                        <div className="font-medium">{locality.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {locality.placeType} • {locality.lat.toFixed(4)}, {locality.lon.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedLocalityData && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Selected: {selectedLocalityData.name}</span>
                    </div>
                    <p className="text-green-700 mt-1">
                      This school will be associated with {selectedLocalityData.name}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Schools in Selected Locality */}
            {selectedLocality && (
              <div>
                <Label className="text-sm font-medium">Schools in {selectedLocalityData?.name}</Label>
                <div className="mt-2 max-h-32 overflow-y-auto border rounded">
                  {loading ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin inline mr-2" />
                      Loading schools...
                    </div>
                  ) : schools.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      No schools found in {selectedLocalityData?.name}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {schools.map(school => (
                        <div
                          key={school.id}
                          className="p-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            // Pre-fill form with selected school data
                            setFormData({
                              name: school.name,
                              address: school.address || '',
                              level: school.level || 'primary',
                              website: school.website || '',
                              phone: school.phone || '',
                              email: school.email || '',
                              isActive: true
                            });
                            toast.success(`Selected ${school.name} - form pre-filled`);
                          }}
                        >
                          <div className="font-medium">{school.name}</div>
                          <div className="text-xs text-muted-foreground">{school.address}</div>
                          <div className="text-xs bg-secondary px-2 py-1 rounded inline-block mt-1">
                            {school.level}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - School Form */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="school-name">School Name *</Label>
                <Input
                  id="school-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., St. Mary's Primary School"
                  required
                />
              </div>

              <div>
                <Label htmlFor="school-level">Level *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value: 'primary' | 'secondary' | 'mixed') =>
                    setFormData(prev => ({ ...prev, level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="school-address">Address</Label>
                <Textarea
                  id="school-address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="School address"
                  rows={3}
                />
                {selectedLocalityData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Will be combined with: {selectedLocalityData.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="school-website">Website</Label>
                  <Input
                    id="school-website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="school-phone">Phone</Label>
                  <Input
                    id="school-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="school-email">Email</Label>
                <Input
                  id="school-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="school@example.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="school-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, isActive: checked as boolean }))
                  }
                />
                <Label htmlFor="school-active" className="text-sm font-medium">
                  Activate this school (show in management table)
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createSchool.isPending || !selectedCounty || !formData.name.trim()}
                  className="flex-1"
                >
                  {createSchool.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create School'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How to Use:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Select a County</strong> - Choose from the dropdown to enable locality search</li>
            <li>• <strong>Search Localities</strong> - Type to search OSM places (e.g., "Greystones", "Arklow")</li>
            <li>• <strong>Click to Select</strong> - Click on any locality to associate the school with that area</li>
            <li>• <strong>Select Existing School</strong> - Click on any school in the list to pre-fill the form</li>
            <li>• <strong>Fill School Details</strong> - Complete the school information form</li>
            <li>• <strong>Activate School</strong> - Check the "Activate this school" checkbox to show it in the management table</li>
            <li>• <strong>Auto-Association</strong> - Selected locality will be automatically included in the address</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}