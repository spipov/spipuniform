import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';

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

interface School {
  id: string;
  name: string;
  address: string;
  level: string;
  localityName?: string;
  countyName: string;
}

export const Route = createFileRoute('/dashboard/spipuniform/data-verification')({
  component: DataVerificationPage,
});

function DataVerificationPage() {
  const [counties, setCounties] = useState<County[]>([]);
  const [osmLocalities, setOSMLocalities] = useState<OSMLocality[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [selectedLocality, setSelectedLocality] = useState<string>('');
  const [localitySearch, setLocalitySearch] = useState<string>('');
  const [schoolSearch, setSchoolSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showAddSchool, setShowAddSchool] = useState(false);

  // New school form state
  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    level: 'primary' as 'primary' | 'secondary',
    website: '',
    phone: '',
    email: ''
  });

  // Fetch counties on mount
  useEffect(() => {
    fetchCounties();
  }, []);

  const fetchCounties = async () => {
    try {
      const response = await fetch('/api/spipuniform/counties');
      const data = await response.json();
      if (data.success) {
        setCounties(data.counties);
      }
    } catch (error) {
      console.error('Error fetching counties:', error);
    }
  };

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

  const searchSchools = async (countyId: string, localityId: string, query: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ countyId });
      
      // If OSM locality is selected, pass its name for geographic filtering
      if (localityId && localityId.startsWith('osm_')) {
        const selectedLocalityData = osmLocalities.find(l => l.id === localityId);
        if (selectedLocalityData) {
          params.append('osmLocalityName', selectedLocalityData.name);
        }
      }
      
      if (query.trim()) {
        params.append('q', query.trim());
      }
      
      const response = await fetch(`/api/spipuniform/schools?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSchools(data.schools);
        // Show message if locality filtering was applied
        if (data.message) {
          console.log('Schools API message:', data.message);
        }
      }
    } catch (error) {
      console.error('Error searching schools:', error);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search functions
  const debouncedLocalitySearch = useCallback(
    debounce((countyId: string, query: string) => {
      if (countyId) {
        searchLocalities(countyId, query);
      }
    }, 500),
    []
  );

  const debouncedSchoolSearch = useCallback(
    debounce((countyId: string, localityId: string, query: string) => {
      if (countyId) {
        searchSchools(countyId, localityId, query);
      }
    }, 500),
    []
  );

  // Reset when county changes
  useEffect(() => {
    if (selectedCounty) {
      setSelectedLocality('');
      setLocalitySearch('');
      setSchoolSearch('');
      setOSMLocalities([]);
      setSchools([]);
      // Load initial schools (no localities loaded until search)
      searchSchools(selectedCounty, '', '');
    }
  }, [selectedCounty]);

  // Search localities when search term changes
  useEffect(() => {
    if (selectedCounty) {
      debouncedLocalitySearch(selectedCounty, localitySearch);
    }
  }, [localitySearch, selectedCounty, debouncedLocalitySearch]);

  // Search schools when search term changes
  useEffect(() => {
    if (selectedCounty) {
      debouncedSchoolSearch(selectedCounty, selectedLocality, schoolSearch);
    }
  }, [schoolSearch, selectedCounty, selectedLocality, debouncedSchoolSearch]);

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedLocalityData = osmLocalities.find(l => l.id === selectedLocality);
      
      // If OSM locality is selected and address doesn't already contain it, append it
      let finalAddress = newSchool.address;
      if (selectedLocalityData && finalAddress && !finalAddress.toLowerCase().includes(selectedLocalityData.name.toLowerCase())) {
        finalAddress = `${finalAddress}, ${selectedLocalityData.name}`;
      } else if (selectedLocalityData && !finalAddress) {
        finalAddress = selectedLocalityData.name;
      }
      
      const response = await fetch('/api/spipuniform/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newSchool,
          address: finalAddress,
          countyId: selectedCounty,
          localityId: null, // Don't try to link to OSM locality ID
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh schools list
        searchSchools(selectedCounty, selectedLocality, schoolSearch);
        // Reset form
        setNewSchool({
          name: '',
          address: '',
          level: 'primary',
          website: '',
          phone: '',
          email: ''
        });
        setShowAddSchool(false);
        alert('School added successfully!');
      } else {
        alert('Error adding school: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding school:', error);
      alert('Error adding school');
    }
  };

  const selectedCountyData = counties.find(c => c.id === selectedCounty);
  const selectedLocalityData = osmLocalities.find(l => l.id === selectedLocality);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Verification (Dynamic OSM)</h1>
        <p className="text-muted-foreground mt-2">
          Test county → locality → school search with live OSM data. Type to search localities and schools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Counties Panel */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Counties ({counties.length})</h2>
          <select
            className="w-full p-2 border rounded mb-4"
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
          >
            <option value="">Select a County</option>
            {counties.map(county => (
              <option key={county.id} value={county.id}>
                {county.name} ({county.schoolCount} schools, {county.localityCount} DB localities)
              </option>
            ))}
          </select>

          {selectedCountyData && (
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <h3 className="font-medium">{selectedCountyData.name}</h3>
              <p className="text-sm text-muted-foreground">
                DB Schools: {selectedCountyData.schoolCount}<br/>
                DB Localities: {selectedCountyData.localityCount}
              </p>
            </div>
          )}
        </div>

        {/* Localities Panel - Dynamic OSM Search */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">
            OSM Localities {selectedCounty && localitySearch && `(${osmLocalities.length} found)`}
          </h2>
          
          {!selectedCounty && (
            <p className="text-muted-foreground italic">Select a county first</p>
          )}
          
          {selectedCounty && (
            <>
              <input
                type="text"
                placeholder="Type to search localities... (e.g., Greystones, Arklow, Bray)"
                value={localitySearch}
                onChange={(e) => setLocalitySearch(e.target.value)}
                className="w-full p-2 border rounded mb-4"
              />

              {loading && <p className="text-muted-foreground text-sm">Searching OSM...</p>}

              {!localitySearch && !loading && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-blue-700">
                    💡 Start typing a locality name to search thousands of places in {counties.find(c => c.id === selectedCounty)?.name}
                  </p>
                </div>
              )}

              {localitySearch && osmLocalities.length === 0 && !loading && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <p className="text-yellow-700">
                    No localities found for "{localitySearch}". Try a different search term.
                  </p>
                </div>
              )}

              {localitySearch && osmLocalities.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Found {osmLocalities.length} localities matching "{localitySearch}":
                  </p>
                  <div className="max-h-48 overflow-y-auto border rounded">
                    {osmLocalities.map(locality => (
                      <div 
                        key={locality.id} 
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedLocality === locality.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => {
                          setSelectedLocality(locality.id);
                          // Optionally update the search to show selected locality name
                          // setLocalitySearch(locality.name);
                        }}
                      >
                        <div className="font-medium text-sm">{locality.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {locality.placeType} • {locality.lat.toFixed(4)}, {locality.lon.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLocalityData && (
                <div className="mt-4 p-4 bg-green-50 rounded">
                  <h3 className="font-medium">✅ Selected: {selectedLocalityData.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Type: {selectedLocalityData.placeType}<br/>
                    Coords: {selectedLocalityData.lat.toFixed(4)}, {selectedLocalityData.lon.toFixed(4)}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedLocality('');
                      setLocalitySearch('');
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Schools Panel - With Search */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Schools {selectedCounty && `(${schools.length})`}
              {selectedLocalityData && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  in {selectedLocalityData.name}
                </span>
              )}
            </h2>
            {selectedCounty && (
              <button
                onClick={() => setShowAddSchool(!showAddSchool)}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
              >
                + Add School
              </button>
            )}
          </div>

          {!selectedCounty && (
            <p className="text-muted-foreground italic">Select a county to see schools</p>
          )}

          {selectedCounty && (
            <>
              <input
                type="text"
                placeholder="Search schools... (e.g., St. Patrick's)"
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                className="w-full p-2 border rounded mb-4"
              />

              {loading && <p className="text-muted-foreground text-sm">Searching...</p>}

              <div className="max-h-96 overflow-y-auto">
                {schools.length === 0 && !loading ? (
                  <p className="text-muted-foreground italic">
                    {schoolSearch ? `No schools found for "${schoolSearch}"` : 'No schools found'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {schools.map(school => (
                      <div key={school.id} className="p-3 border rounded">
                        <h4 className="font-medium text-sm">{school.name}</h4>
                        <p className="text-xs text-muted-foreground">{school.address}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {school.level}
                          </span>
                          {!school.localityName && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                              No locality
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add School Form */}
      {showAddSchool && (
        <div className="bg-card rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add New School</h3>
            {selectedLocalityData && (
              <span className="text-sm text-muted-foreground bg-green-50 px-3 py-1 rounded">
                📍 Will be added to {selectedLocalityData.name}
              </span>
            )}
          </div>
          {selectedLocalityData && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
              <p className="text-green-700">
                <strong>Location Context:</strong> This school will be automatically associated with <strong>{selectedLocalityData.name}</strong> by including it in the address.
                This ensures it will appear when users filter by {selectedLocalityData.name}.
              </p>
            </div>
          )}
          <form onSubmit={handleAddSchool} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">School Name *</label>
              <input
                type="text"
                required
                value={newSchool.name}
                onChange={(e) => setNewSchool(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="e.g., St. Mary's Primary School"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Level *</label>
              <select
                value={newSchool.level}
                onChange={(e) => setNewSchool(prev => ({ ...prev, level: e.target.value as 'primary' | 'secondary' }))}
                className="w-full p-2 border rounded"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={newSchool.address}
                onChange={(e) => setNewSchool(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="School address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                value={newSchool.website}
                onChange={(e) => setNewSchool(prev => ({ ...prev, website: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={newSchool.phone}
                onChange={(e) => setNewSchool(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="Phone number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={newSchool.email}
                onChange={(e) => setNewSchool(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="school@example.com"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Add School
              </button>
              <button
                type="button"
                onClick={() => setShowAddSchool(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">How to Use:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Select a County</strong> - Choose from dropdown to load schools</li>
          <li>• <strong>Search Localities</strong> - Type to search thousands of OSM places (e.g., "Greystones", "Arklow")</li>
          <li>• <strong>Click to Select</strong> - Click on any locality to filter schools to that area</li>
          <li>• <strong>Geographic Filtering</strong> - Schools automatically filter to selected locality (e.g., Greystones, Bray)</li>
          <li>• <strong>Search Schools</strong> - Type to further filter schools by name or address</li>
          <li>• <strong>Add Missing Schools</strong> - Schools added while locality is selected are automatically linked to that locality</li>
          <li>• <strong>No Limits</strong> - Search covers ALL OSM localities, not just the first 100!</li>
        </ul>
      </div>
    </div>
  );
}