import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Navigation, Building } from 'lucide-react';
import { getCounties, getLocalitiesByCounty, type County, type Locality } from '@/data/irish-geographic-data';

interface LocationSelectorProps {
  selectedCounty?: string;
  selectedLocality?: string;
  onLocationChange: (county: string | null, locality: string | null) => void;
  className?: string;
  showCard?: boolean;
}

export function LocationSelector({
  selectedCounty,
  selectedLocality,
  onLocationChange,
  className = '',
  showCard = true
}: LocationSelectorProps) {
  const [counties, setCounties] = useState<County[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load counties from fallback data
    const countyData = getCounties();
    setCounties(countyData);
  }, []);

  useEffect(() => {
    if (selectedCounty) {
      // Load localities for selected county
      const localityData = getLocalitiesByCounty(selectedCounty);
      setLocalities(localityData);
    } else {
      setLocalities([]);
    }
  }, [selectedCounty]);

  const handleCountyChange = (countyId: string) => {
    onLocationChange(countyId, null); // Reset locality when county changes
  };

  const handleLocalityChange = (localityId: string) => {
    onLocationChange(selectedCounty || null, localityId);
  };

  const content = (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="county-select" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          County
        </Label>
        <Select value={selectedCounty || ''} onValueChange={handleCountyChange}>
          <SelectTrigger id="county-select">
            <SelectValue placeholder="Select a county" />
          </SelectTrigger>
          <SelectContent>
            {counties.map(county => (
              <SelectItem key={county.id} value={county.id}>
                {county.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCounty && (
        <div className="space-y-2">
          <Label htmlFor="locality-select" className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Locality
          </Label>
          <Select value={selectedLocality || ''} onValueChange={handleLocalityChange}>
            <SelectTrigger id="locality-select">
              <SelectValue placeholder="Select a locality" />
            </SelectTrigger>
            <SelectContent>
              {localities.map(locality => (
                <SelectItem key={locality.id} value={locality.id}>
                  {locality.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedCounty && selectedLocality && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Building className="h-4 w-4 text-green-600" />
          <div className="text-sm">
            <p className="font-medium text-green-800">Location Selected</p>
            <p className="text-green-700">
              {counties.find(c => c.id === selectedCounty)?.name}, {localities.find(l => l.id === selectedLocality)?.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Selection
          </CardTitle>
          <CardDescription>
            Select your county and locality to find schools in your area
          </CardDescription>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}