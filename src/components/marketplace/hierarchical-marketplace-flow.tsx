import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  School,
  ShoppingBag,
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Package,
  Heart,
  MessageCircle,
  Eye,
  Building2,
  GraduationCap,
  ChevronDown,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';
import { FavoriteButton } from '@/components/marketplace/favorite-button';
import { RequestCreationDialog } from '@/components/marketplace/request-creation-dialog';
import { SchoolSetupRequestDialog } from '@/components/marketplace/school-setup-request-dialog';

// Simple debounce function (like data verification page)
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
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

interface OSMLocality {
  id: string;
  name: string;
  placeType: string;
  lat: number;
  lon: number;
  isOSM: boolean;
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
  const [selectedLocality, setSelectedLocality] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [schoolType, setSchoolType] = useState<'primary' | 'secondary'>('primary');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showSchoolSetupRequestDialog, setShowSchoolSetupRequestDialog] = useState(false);
  const [localitySearchTerm, setLocalitySearchTerm] = useState<string>('');
  const [isLocalitySearchOpen, setIsLocalitySearchOpen] = useState(false);

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

  // Debounced setter for locality search to avoid hammering Overpass
  const setLocalitySearchTermDebounced = useMemo(
    () => debounce((v: string) => setLocalitySearchTerm(v), 500),
    []
  );

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

  // Get static localities for immediate display
  const { data: staticLocalities } = useQuery<Locality[]>({
    queryKey: ['static-localities', selectedCounty],
    queryFn: async () => {
      if (!selectedCounty) return [];
      const { getLocalitiesByCounty } = await import('@/data/irish-geographic-data');
      return getLocalitiesByCounty(selectedCounty);
    },
    enabled: !!selectedCounty
  });

  // Search localities - show static data immediately, enhance with OSM when available
  const { data: searchedLocalities } = useQuery<OSMLocality[]>({
    queryKey: ['localities-search', selectedCounty, localitySearchTerm],
    queryFn: async () => {
      if (!selectedCounty) return [];

      // Always start with static localities
      let localities = (staticLocalities || [])
        .filter(locality =>
          !localitySearchTerm ||
          locality.name.toLowerCase().includes((localitySearchTerm || '').toLowerCase())
        )
        .slice(0, 10)
        .map(locality => ({
          id: locality.id,
          name: locality.name,
          placeType: 'town',
          lat: 0,
          lon: 0,
          isOSM: false
        }));

      // Try to enhance with OSM results if search term is present
      if (localitySearchTerm && localitySearchTerm.trim().length >= 2) {
        try {
          const params = new URLSearchParams({
            countyId: selectedCounty,
            q: localitySearchTerm.trim()
          });

          const response = await fetch(`/api/spipuniform/localities/search?${params}`);
          if (response.ok) {
            const data = await response.json();
            const osmLocalities = (data.localities || []).map((loc: any) => ({
              id: loc.id,
              name: loc.name,
              placeType: loc.placeType,
              lat: loc.lat,
              lon: loc.lon,
              isOSM: true
            }));

            // Combine OSM and static results, preferring OSM
            localities = [...osmLocalities, ...localities].slice(0, 10);
          }
        } catch (error) {
          console.warn('OSM search failed, using static data only:', error);
        }
      }

      return localities;
    },
    enabled: !!selectedCounty
  });

  const { data: schools } = useQuery<School[]>({
    queryKey: ['schools-by-location-and-type', selectedCounty, selectedLocality, schoolType],
    queryFn: async () => {
      if (!selectedCounty || !selectedLocality) return [];

      const params = new URLSearchParams({
        countyId: selectedCounty,
        level: schoolType
      });

      // For locality filtering, use the locality name directly from static data
      // This avoids dependency on the searchedLocalities query timing
      const { getLocalityById } = await import('@/data/irish-geographic-data');
      const staticLocalityData = getLocalityById(selectedLocality);

      if (staticLocalityData) {
        // Use osmLocalityName to filter schools by address containing locality name
        params.set('osmLocalityName', staticLocalityData.name);
        // Prevent fallback to all county schools for marketplace queries
        params.set('marketplace', 'true');
      }

      // For school setup requests, include all schools (CSV and manual, active and inactive)
      if (showSchoolSetupRequestDialog) {
        params.set('schoolSetup', 'true');
      }

      // Also try OSM localities if available
      const selectedLocalityData = searchedLocalities?.find(l => l.id === selectedLocality);
      if (selectedLocalityData?.isOSM) {
        // Override with OSM name if available (more accurate)
        params.set('osmLocalityName', selectedLocalityData.name);
      }

      const response = await fetch(`/api/spipuniform/schools?${params}`);
      if (!response.ok) throw new Error('Failed to fetch schools');
      const data = await response.json();
      return data.schools || [];
    },
    enabled: !!selectedCounty && !!selectedLocality
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
    setSelectedLocality('');
    setSelectedSchool('');
  };

  const handleLocalitySelect = (localityId: string) => {
    setSelectedLocality(localityId);
    setSelectedSchool('');
  };

  const handleSchoolSelect = (schoolId: string) => {
    setSelectedSchool(schoolId);
  };

  const resetFlow = () => {
    setSelectedCounty('');
    setSelectedLocality('');
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
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="marketplace-locality-input">Town/Locality</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="marketplace-locality-input"
                placeholder="Type to search localities..."
                value={localitySearchTerm}
                onChange={(e) => setLocalitySearchTermDebounced(e.target.value)}
                onFocus={() => setIsLocalitySearchOpen(true)}
                onBlur={() => setTimeout(() => setIsLocalitySearchOpen(false), 200)}
                className="pl-10"
              />
              {isLocalitySearchOpen && (
                <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {!localitySearchTerm ? (
                    // Show all localities when no search term
                    searchedLocalities && searchedLocalities.length > 0 ? (
                      <>
                        <div className="px-3 py-2 text-xs text-muted-foreground border-b bg-blue-50">
                          Popular localities in {counties?.find(c => c.id === selectedCounty)?.name}:
                        </div>
                        {searchedLocalities.slice(0, 10).map((locality) => (
                          <button
                            key={locality.id}
                            onClick={() => {
                              handleLocalitySelect(locality.id);
                              setLocalitySearchTerm(locality.name);
                              setIsLocalitySearchOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 border-b border-border/50 last:border-b-0"
                          >
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{locality.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {locality.placeType}
                                {locality.isOSM && (
                                  <span className="ml-1 text-blue-500">• OSM data</span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-3 py-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <p className="text-yellow-700">
                          Loading localities...
                        </p>
                      </div>
                    )
                  ) : (
                    // Show filtered results when searching
                    searchedLocalities && searchedLocalities.length > 0 ? (
                      <>
                        <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                          Found {searchedLocalities.length} localities matching "{localitySearchTerm}":
                        </div>
                        {searchedLocalities.map((locality) => (
                          <button
                            key={locality.id}
                            onClick={() => {
                              handleLocalitySelect(locality.id);
                              setLocalitySearchTerm(locality.name);
                              setIsLocalitySearchOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 border-b border-border/50 last:border-b-0"
                          >
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{locality.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {locality.placeType}
                                {locality.isOSM && (
                                  <span className="ml-1 text-blue-500">• OSM data</span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-3 py-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <p className="text-yellow-700">
                          No localities found matching "{localitySearchTerm}". Try a different search term.
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* School Type Selection */}
        {selectedLocality && (
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
        {selectedLocality && (
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
                      No {schoolType} schools found in {searchedLocalities?.find(l => l.id === selectedLocality)?.name}
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
        {(selectedCounty || selectedLocality || selectedSchool) && (
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
                    {searchedLocalities?.find(l => l.id === selectedLocality)?.name || 'Selected locality'}
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