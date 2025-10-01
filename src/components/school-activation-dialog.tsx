import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, School, CheckCircle2 } from 'lucide-react';
import { LocalitySearch } from '@/components/shared/locality-search';

interface County {
  id: string;
  name: string;
}

interface InactiveSchool {
  id: string;
  name: string;
  level?: string;
  address?: string;
  localityName?: string;
  countyName?: string;
  csvSourceRow?: any;
}

interface SchoolActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SchoolActivationDialog({ open, onOpenChange, onSuccess }: SchoolActivationDialogProps) {
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [selectedLocalityName, setSelectedLocalityName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<InactiveSchool | null>(null);
  const queryClient = useQueryClient();

  const { data: counties } = useQuery<County[]>({
    queryKey: ['counties'],
    queryFn: async () => {
      const response = await fetch('/api/counties');
      if (!response.ok) throw new Error('Failed to fetch counties');
      const data = await response.json();
      return data.counties || [];
    },
  });

  // Fetch inactive schools based on filters
  const { data: inactiveSchools = [], isLoading: isLoadingSchools } = useQuery<InactiveSchool[]>({
    queryKey: ['schools', 'inactive', selectedCounty, selectedLocalityName, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        active: 'false',
        limit: '100'
      });
      
      if (searchQuery) {
        params.append('query', searchQuery);
      }
      
      const response = await fetch(`/api/schools?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch schools');
      const data = await response.json();
      
      let schools = data.schools || [];
      
      // Filter by county and locality on client side
      if (selectedCounty && counties) {
        const county = counties.find(c => c.id === selectedCounty);
        if (county) {
          schools = schools.filter((s: InactiveSchool) => s.countyName === county.name);
        }
      }
      
      if (selectedLocalityName) {
        schools = schools.filter((s: InactiveSchool) => 
          s.localityName?.toLowerCase() === selectedLocalityName.toLowerCase()
        );
      }
      
      return schools;
    },
    enabled: open, // Only fetch when dialog is open
  });

  const activateSchool = useMutation({
    mutationFn: async (schoolId: string) => {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to activate school');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('School activated successfully!');
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      handleClose();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate school');
    },
  });

  const handleClose = () => {
    setSelectedCounty('');
    setSelectedLocalityName('');
    setSearchQuery('');
    setSelectedSchool(null);
    onOpenChange(false);
  };

  const handleActivate = () => {
    if (!selectedSchool) {
      toast.error('Please select a school to activate');
      return;
    }
    activateSchool.mutate(selectedSchool.id);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activate School from Database</DialogTitle>
          <DialogDescription>
            Search for and activate schools from the CSV import. Use filters to narrow down results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="county">County (Optional)</Label>
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger id="county" name="county-filter">
                  <SelectValue placeholder="All Counties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {counties?.map((county) => (
                    <SelectItem key={county.id} value={county.id}>
                      {county.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locality">Locality (Optional)</Label>
              {selectedCounty ? (
                <LocalitySearch
                  countyId={selectedCounty}
                  value={selectedLocalityName}
                  onChange={(localityId, localityName) => setSelectedLocalityName(localityName)}
                  placeholder="Search locality..."
                />
              ) : (
                <Input
                  id="locality"
                  placeholder="Select county first"
                  disabled
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">School Name</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  name="school-search"
                  placeholder="Search schools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Selected Filters Display */}
          {(selectedCounty || selectedLocalityName) && (
            <div className="flex gap-2 flex-wrap">
              {selectedCounty && (
                <Badge variant="secondary" className="gap-1">
                  County: {counties?.find(c => c.id === selectedCounty)?.name}
                  <button
                    onClick={() => setSelectedCounty('')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedLocalityName && (
                <Badge variant="secondary" className="gap-1">
                  Locality: {selectedLocalityName}
                  <button
                    onClick={() => setSelectedLocalityName('')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Schools List */}
          <div className="border rounded-lg">
            <div className="p-3 border-b bg-muted/50">
              <h4 className="font-medium text-sm">
                Inactive Schools ({inactiveSchools.length})
              </h4>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {isLoadingSchools ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : inactiveSchools.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <School className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No inactive schools found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or search query</p>
                </div>
              ) : (
                <div className="divide-y">
                  {inactiveSchools.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => setSelectedSchool(school)}
                      className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                        selectedSchool?.id === school.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                      }`}
                      name={`school-item-${school.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium truncate">{school.name}</span>
                            {school.csvSourceRow && (
                              <Badge variant="secondary" className="text-xs">CSV</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                            {school.localityName && (
                              <div>{school.localityName}, {school.countyName}</div>
                            )}
                            {school.level && (
                              <Badge variant="outline" className="text-xs">
                                {school.level}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {selectedSchool?.id === school.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected School Details */}
          {selectedSchool && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium mb-2">Selected School</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {selectedSchool.name}
                </div>
                {selectedSchool.level && (
                  <div>
                    <span className="font-medium">Level:</span> {selectedSchool.level}
                  </div>
                )}
                {selectedSchool.localityName && (
                  <div>
                    <span className="font-medium">Location:</span> {selectedSchool.localityName}, {selectedSchool.countyName}
                  </div>
                )}
                {selectedSchool.address && (
                  <div>
                    <span className="font-medium">Address:</span> {selectedSchool.address}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={activateSchool.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleActivate}
            disabled={!selectedSchool || activateSchool.isPending}
            name="activate-school-button"
          >
            {activateSchool.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Activating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Activate School
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

