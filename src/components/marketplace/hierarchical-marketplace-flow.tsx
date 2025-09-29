import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import {
  School,
  Plus,
  Package,
  Eye,
  Building2,
  GraduationCap,
  X,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { FavoriteButton } from '@/components/marketplace/favorite-button';
import { RequestCreationDialog } from '@/components/marketplace/request-creation-dialog';
import { SchoolSetupRequestDialog } from '@/components/marketplace/school-setup-request-dialog';
import { LocalitySearch } from '@/components/shared/locality-search';

interface County {
  id: string;
  name: string;
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
  website?: string;
  phone?: string;
  email?: string;
}

interface Listing {
  id: string;
  title: string;
  price?: number;
  isFree: boolean;
  condition?: { name: string };
  category?: { name: string };
  school?: { name: string };
  primaryImage?: string;
  imageCount?: number;
  viewCount?: number;
  publishedAt: string;
}

interface HierarchicalMarketplaceFlowProps {
  onRequestCreate?: (schoolId: string) => void;
  onListingCreate?: (schoolId: string) => void;
}

export function HierarchicalMarketplaceFlow({
  onRequestCreate,
  onListingCreate
}: HierarchicalMarketplaceFlowProps) {
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>('');
  const [selectedLocalityName, setSelectedLocalityName] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [schoolType, setSchoolType] = useState<'primary' | 'secondary'>('primary');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showSchoolSetupRequestDialog, setShowSchoolSetupRequestDialog] = useState(false);

  // Expose function to trigger school setup dialog
  useEffect(() => {
    const handleTriggerSchoolSetup = () => {
      setShowSchoolSetupRequestDialog(true);
    };

    window.addEventListener('triggerSchoolSetup', handleTriggerSchoolSetup);

    // Also expose the function globally for direct access
    (window as any).triggerHierarchicalSchoolSetup = () => {
      setShowSchoolSetupRequestDialog(true);
    };

    return () => {
      window.removeEventListener('triggerSchoolSetup', handleTriggerSchoolSetup);
      delete (window as any).triggerHierarchicalSchoolSetup;
    };
  }, []);

  // Fetch geographic data
  const { data: counties } = useQuery({
    queryKey: ['counties'],
    queryFn: async () => {
      const response = await fetch('/api/counties');
      if (!response.ok) throw new Error('Failed to fetch counties');
      const data = await response.json();
      return data.counties as County[];
    }
  });

  const { data: schools } = useQuery<School[]>({
    queryKey: ['schools-by-location-and-type', selectedCounty, selectedLocalityName, schoolType],
    queryFn: async () => {
      if (!selectedCounty || !selectedLocalityName) return [];

      const params = new URLSearchParams({
        countyId: selectedCounty,
        level: schoolType,
        osmLocalityName: selectedLocalityName, // Use locality name for address matching
        marketplace: 'true'
      });

      // For school setup requests, include all schools (CSV and manual, active and inactive)
      if (showSchoolSetupRequestDialog) {
        params.set('schoolSetup', 'true');
      }

      const response = await fetch(`/api/spipuniform/schools?${params}`);
      if (!response.ok) throw new Error('Failed to fetch schools');
      const data = await response.json();
      return data.schools || [];
    },
    enabled: !!selectedCounty && !!selectedLocalityName
  });

  const { data: schoolListings } = useQuery({
    queryKey: ['school-listings', selectedSchool],
    queryFn: async () => {
      if (!selectedSchool) return { listings: [], total: 0 };

      const response = await fetch(`/api/marketplace/search?schoolId=${selectedSchool}`);
      if (!response.ok) throw new Error('Failed to fetch school listings');
      const data = await response.json();
      return data;
    },
    enabled: !!selectedSchool
  });

  const handleCountySelect = (countyId: string) => {
    setSelectedCounty(countyId);
    setSelectedLocalityId('');
    setSelectedLocalityName('');
    setSelectedSchool('');
  };

  const handleSchoolSelect = (schoolId: string) => {
    setSelectedSchool(schoolId);
  };

  const resetFlow = () => {
    setSelectedCounty('');
    setSelectedLocalityId('');
    setSelectedLocalityName('');
    setSelectedSchool('');
  };

  const handleRequestCreate = () => {
    if (selectedSchool) {
      setShowRequestDialog(true);
    }
  };

  const handleListingCreate = () => {
    if (selectedSchool && onListingCreate) {
      onListingCreate(selectedSchool);
    }
  };

  const ListingCard = ({ listing }: { listing: Listing }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex space-x-4">
          {/* Image */}
          <div className="w-32 h-32 bg-muted rounded-l-lg overflow-hidden flex-shrink-0">
            {listing.primaryImage ? (
              <img
                src={listing.primaryImage}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {listing.imageCount && listing.imageCount > 1 && (
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                +{listing.imageCount - 1}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 py-4 pr-4 space-y-2">
            <div className="flex items-start justify-between">
              <a
                href={`/marketplace/listings/${listing.id}`}
                className="text-lg font-medium hover:underline line-clamp-1"
              >
                {listing.title}
              </a>
              <div className="flex items-center gap-2 ml-2">
                {listing.isFree ? (
                  <Badge className="bg-green-500 text-xs">FREE</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    €{listing.price}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <School className="h-3 w-3" />
              <span>{listing.school?.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {listing.condition?.name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {listing.category?.name}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {listing.viewCount || 0}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(listing.publishedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Favorite button */}
          <div className="py-4 pr-4">
            <FavoriteButton
              listingId={listing.id}
              listingTitle={listing.title}
              className="bg-white/80 hover:bg-white"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Mobile-first design with dropdowns */}
      <div className="space-y-4">
        {/* County Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="marketplace-county-select">County</label>
          <Select value={selectedCounty} onValueChange={handleCountySelect}>
            <SelectTrigger id="marketplace-county-select" className="w-full">
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

        {/* Locality Selection */}
        {selectedCounty && (
          <LocalitySearch
            countyId={selectedCounty}
            value={selectedLocalityId}
            onChange={(id, name) => {
              setSelectedLocalityId(id);
              setSelectedLocalityName(name);
              setSelectedSchool(''); // Reset school when locality changes
            }}
            label="Town/Locality"
            placeholder="Type to search localities..."
          />
        )}

        {/* School Type Selection */}
        {selectedLocalityName && (
          <div className="space-y-2">
            <label className="text-sm font-medium">School Type</label>
            <Tabs value={schoolType} onValueChange={(value) => setSchoolType(value as 'primary' | 'secondary')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="primary" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Primary
                </TabsTrigger>
                <TabsTrigger value="secondary" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Secondary
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* School Selection */}
        {selectedLocalityName && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">School</label>
              {schools && schools.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSchoolSetupRequestDialog(true)}
                  className="text-xs"
                  data-testid="school-setup-button"
                >
                  + Request School Setup
                </Button>
              )}
            </div>
            {schools && schools.length === 0 && (
              <p className="text-xs text-muted-foreground">
                If you cannot see your school, please request its addition to moderators/admins.
              </p>
            )}
            <Select value={selectedSchool} onValueChange={handleSchoolSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select ${schoolType} school`} />
              </SelectTrigger>
              <SelectContent>
                {schools && schools.length > 0 ? (
                  schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{school.name}</span>
                        {school.address && (
                          <span className="text-xs text-muted-foreground">{school.address}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-3">
                      No {schoolType} schools found in {selectedLocalityName}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSchoolSetupRequestDialog(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Request School Setup
                    </Button>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Reset button */}
        {(selectedCounty || selectedLocalityName || selectedSchool) && (
          <Button variant="outline" onClick={resetFlow} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Reset Selection
          </Button>
        )}
      </div>

      {/* School Items Display */}
      {selectedSchool && (
        <div className="space-y-6">
          {/* School header */}
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <School className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">
                      {schools?.find(s => s.id === selectedSchool)?.name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {schoolType === 'primary' ? 'Primary' : 'Secondary'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {counties?.find(c => c.id === selectedCounty)?.name}, {' '}
                    {selectedLocalityName || 'Selected locality'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available items */}
          {schoolListings?.listings?.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Available Items ({schoolListings.total})
                </h3>
                <Button onClick={handleListingCreate} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  List an Item
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {schoolListings.listings.map((listing: Listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No items available</h3>
                <p className="text-muted-foreground mb-6">
                  There are no uniform items currently listed for this school.
                  Be the first to list an item or create a request for what you need.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleListingCreate} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    List an Item
                  </Button>
                  <Button variant="outline" onClick={handleRequestCreate} className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Request Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Request Creation Dialog */}
      <RequestCreationDialog
        schoolId={selectedSchool}
        schoolName={schools?.find(s => s.id === selectedSchool)?.name || ''}
        isOpen={showRequestDialog}
        onClose={() => setShowRequestDialog(false)}
        onSuccess={() => {
          toast.success('Request created successfully!');
        }}
      />

      {/* School Setup Request Dialog */}
      <SchoolSetupRequestDialog
        isOpen={showSchoolSetupRequestDialog}
        onClose={() => setShowSchoolSetupRequestDialog(false)}
        onSuccess={() => {
          toast.success('School setup request submitted! We\'ll review and set up your school soon.');
        }}
      />
    </div>
  );
}