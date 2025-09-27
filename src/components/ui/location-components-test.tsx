import React, { useState } from 'react';
import { LocationSelector } from './location-selector';
import { SchoolSelector } from './school-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Separator } from './separator';
import { MapPin, School } from 'lucide-react';

export function LocationComponentsTest() {
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [selectedLocality, setSelectedLocality] = useState<string | null>(null);
  const [primarySchool, setPrimarySchool] = useState<string | null>(null);
  const [additionalSchools, setAdditionalSchools] = useState<string[]>([]);

  const handleLocationChange = (county: string | null, locality: string | null) => {
    setSelectedCounty(county);
    setSelectedLocality(locality);
    // Reset school selection when location changes
    setPrimarySchool(null);
    setAdditionalSchools([]);
  };

  const handleSchoolsChange = (primary: string | null, additional: string[]) => {
    setPrimarySchool(primary);
    setAdditionalSchools(additional);
  };

  const resetSelections = () => {
    setSelectedCounty(null);
    setSelectedLocality(null);
    setPrimarySchool(null);
    setAdditionalSchools([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Components Test
          </CardTitle>
          <CardDescription>
            Testing LocationSelector and SchoolSelector components in isolation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetSelections} variant="outline" className="mb-4">
            Reset All Selections
          </Button>

          <div className="grid gap-6 md:grid-cols-1">
            {/* Location Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Step 1: Select Location
              </h3>
              <LocationSelector
                selectedCounty={selectedCounty || undefined}
                selectedLocality={selectedLocality || undefined}
                onLocationChange={handleLocationChange}
                showCard={false}
              />

              {selectedCounty && selectedLocality && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Location Selected:</p>
                  <p className="text-sm text-blue-700">
                    County: {selectedCounty} | Locality: {selectedLocality}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* School Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <School className="h-4 w-4" />
                Step 2: Select Schools
              </h3>

              {(!selectedCounty || !selectedLocality) ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <School className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Please select a location first to choose schools</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <SchoolSelector
                  primarySchoolId={primarySchool || undefined}
                  additionalSchools={additionalSchools}
                  onSchoolsChange={handleSchoolsChange}
                />
              )}
            </div>
          </div>

          {/* Summary */}
          <Separator className="my-6" />

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Selection Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-2 text-sm">
                <div>
                  <strong>Location:</strong> {
                    selectedCounty && selectedLocality
                      ? `${selectedCounty} → ${selectedLocality}`
                      : 'Not selected'
                  }
                </div>
                <div>
                  <strong>Primary School:</strong> {
                    primarySchool || 'Not selected'
                  }
                </div>
                <div>
                  <strong>Additional Schools:</strong> {
                    additionalSchools.length > 0
                      ? additionalSchools.join(', ')
                      : 'None selected'
                  }
                </div>
                <div>
                  <strong>Total Schools:</strong> {
                    [primarySchool, ...additionalSchools].filter(Boolean).length
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}