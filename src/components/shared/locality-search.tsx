import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';

interface Locality {
  id: string;
  name: string;
  displayName: string;
  placeType?: string;
  lat?: number;
  lon?: number;
}

interface LocalitySearchProps {
  countyId: string;
  value: string;
  onChange: (localityId: string, localityName: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LocalitySearch({
  countyId,
  value,
  onChange,
  label = 'Town/Locality',
  placeholder = 'Type to search localities...',
  disabled = false,
  className = ''
}: LocalitySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Debounce search term (500ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch localities from OSM
  const { data: localities, isLoading, error } = useQuery<Locality[]>({
    queryKey: ['localities-search', countyId, debouncedTerm],
    queryFn: async () => {
      if (!countyId) return [];

      const params = new URLSearchParams({
        countyId,
        search: debouncedTerm
      });

      const response = await fetch(`/api/localities/search?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch localities');
      }
      const data = await response.json();
      return data.localities || [];
    },
    enabled: !!countyId,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 2,
  });

  const handleSelect = (locality: Locality) => {
    onChange(locality.id, locality.name);
    setSearchTerm(locality.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className={`locality-search ${className}`}>
      {label && <Label htmlFor="locality-search">{label} *</Label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="locality-search"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="pl-10"
          disabled={disabled || !countyId}
        />
        {isOpen && countyId && (
          <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto mt-1">
            {isLoading ? (
              <div className="px-3 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading localities...
              </div>
            ) : error ? (
              <div className="px-3 py-3 text-sm text-destructive">
                {error instanceof Error ? error.message : 'Failed to load localities'}
              </div>
            ) : localities && localities.length > 0 ? (
              <>
                {!searchTerm && (
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b bg-blue-50">
                    Popular localities (type to search for more)
                  </div>
                )}
                {localities.map((locality) => (
                  <button
                    key={locality.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm transition-colors"
                    onClick={() => handleSelect(locality)}
                  >
                    <div className="font-medium">{locality.name}</div>
                    {locality.placeType && (
                      <div className="text-xs text-muted-foreground capitalize">
                        {locality.placeType}
                      </div>
                    )}
                  </button>
                ))}
              </>
            ) : (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                {searchTerm ? (
                  <>
                    No localities found for "{searchTerm}".
                    <br />
                    <span className="text-xs">Try a different spelling or nearby town.</span>
                  </>
                ) : (
                  'Start typing to search localities...'
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {!countyId && (
        <p className="text-xs text-muted-foreground mt-1">
          Please select a county first
        </p>
      )}
    </div>
  );
}

