import React from 'react';
import { ChevronRight, Search, Home, Upload, FolderPlus, Grid3X3, List, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFileManager } from './file-manager-provider';
import { cn } from '@/lib/utils';

interface BreadcrumbNavigationProps {
  className?: string;
}

function BreadcrumbNavigation({ className }: BreadcrumbNavigationProps) {
  const { state, navigateToPath } = useFileManager();

  const handleNavigate = (path: string) => {
    navigateToPath(path);
  };

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      <button
        onClick={() => handleNavigate('/uploads')}
        className="flex items-center hover:text-blue-600 transition-colors"
        aria-label="Go to uploads directory"
      >
        <Home className="h-4 w-4 mr-1" />
        <span className="sr-only">Uploads</span>
      </button>

      {state.breadcrumbs.map((crumb, index) => {
        const path = '/' + state.breadcrumbs.slice(0, index + 1).join('/');
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <button
              onClick={() => handleNavigate(path)}
              className="hover:text-blue-600 transition-colors truncate max-w-32"
              title={crumb}
            >
              {crumb}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

interface SearchBarProps {
  className?: string;
}

function SearchBar({ className }: SearchBarProps) {
  const { state, setSearchQuery } = useFileManager();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder="Search files and folders..."
        value={state.searchQuery}
        onChange={handleSearchChange}
        className="pl-10 w-64"
        aria-label="Search files and folders"
      />
    </div>
  );
}

interface NavigationHeaderProps {
  className?: string;
  onUpload?: (files: FileList) => void;
  onCreateFolder?: () => void;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function NavigationHeader({ className, onUpload, onCreateFolder, onToggleSidebar, showSidebarToggle }: NavigationHeaderProps) {
  const { state, setViewMode } = useFileManager();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && onUpload) {
      onUpload(files);
    }
    // Reset input
    event.target.value = '';
  };

  const handleCreateFolder = () => {
    if (onCreateFolder) {
      onCreateFolder();
    }
  };

  const handleToggleSidebar = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  return (
    <header className={cn("bg-white border-b border-gray-200 p-4 space-y-4", className)}>
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle (Mobile Only) */}
          {showSidebarToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleSidebar}
              className="mr-2"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}

          {/* Search Bar */}
          <SearchBar />

          {/* Current Path Info */}
          <div className="text-sm text-gray-600">
            {state.files.length} items
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <Button
              variant={state.viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={state.viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none border-l border-gray-300"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Upload Button */}
          <label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Upload files"
            />
            <Button asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </span>
            </Button>
          </label>

          {/* Create Folder Button */}
          <Button variant="outline" onClick={handleCreateFolder}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>
    </header>
  );
}

export default NavigationHeader;