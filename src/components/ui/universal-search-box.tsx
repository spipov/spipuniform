import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Filter, Clock, TrendingUp } from 'lucide-react';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'category';
  count?: number;
}

interface UniversalSearchBoxProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  suggestions?: SearchSuggestion[];
  showFilters?: boolean;
  className?: string;
  debounceMs?: number;
}

export function UniversalSearchBox({
  placeholder = "Search uniforms, schools, or items...",
  onSearch,
  onFilter,
  suggestions = [],
  showFilters = false,
  className = '',
  debounceMs = 300
}: UniversalSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        onSearch(query.trim());
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    onSearch(searchQuery);
    setIsOpen(false);

    // Add to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    onSearch('');
    inputRef.current?.focus();
  };

  const removeRecentSearch = (searchToRemove: string) => {
    const updated = recentSearches.filter(s => s !== searchToRemove);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const defaultSuggestions: SearchSuggestion[] = [
    { id: '1', text: 'School uniforms', type: 'category' },
    { id: '2', text: 'Sports jerseys', type: 'category' },
    { id: '3', text: 'Primary school', type: 'popular', count: 1250 },
    { id: '4', text: 'Secondary school', type: 'popular', count: 890 },
  ];

  const allSuggestions = [...suggestions, ...defaultSuggestions];
  const filteredSuggestions = allSuggestions.filter(suggestion =>
    suggestion.text.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {showFilters && onFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="h-6 w-6 p-0"
            >
              <Filter className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-auto">
          <CardContent className="p-0">
            {/* Search suggestions */}
            {query && filteredSuggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Suggestions
                </div>
                {filteredSuggestions.map(suggestion => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSearch(suggestion.text)}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-sm flex items-center justify-between group"
                  >
                    <span className="text-sm">{suggestion.text}</span>
                    {suggestion.count && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Recent searches */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllRecent}
                    className="h-6 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
                {recentSearches.map((search, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 hover:bg-muted rounded-sm group"
                  >
                    <button
                      onClick={() => handleSearch(search)}
                      className="text-sm text-left flex-1"
                    >
                      {search}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecentSearch(search)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {query && filteredSuggestions.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No suggestions found</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleSearch(query)}
                  className="text-xs"
                >
                  Search for "{query}"
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}