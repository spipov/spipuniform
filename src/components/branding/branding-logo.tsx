import React from 'react';
import { cn } from '@/lib/utils';

interface BrandingData {
  siteName?: string;
  logoUrl?: string;
  logoAlt?: string;
  logoDisplayMode?: 'logo-only' | 'logo-with-name' | 'name-only';
  primaryColor?: string;
  secondaryColor?: string;
  [key: string]: unknown;
}

interface BrandingLogoProps {
  siteName?: string;
  logoUrl?: string;
  logoAlt?: string;
  logoDisplayMode?: 'logo-only' | 'logo-with-name' | 'name-only';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
}

export function BrandingLogo({
  siteName = 'My App',
  logoUrl,
  logoAlt,
  logoDisplayMode = 'logo-with-name',
  className,
  size = 'md',
  href,
  onClick,
}: BrandingLogoProps) {
  const sizeClasses = {
    sm: {
      logo: 'h-6 w-6',
      text: 'text-lg font-semibold',
      gap: 'gap-2',
    },
    md: {
      logo: 'h-8 w-8',
      text: 'text-xl font-bold',
      gap: 'gap-2',
    },
    lg: {
      logo: 'h-12 w-12',
      text: 'text-2xl font-bold',
      gap: 'gap-3',
    },
  };

  const currentSize = sizeClasses[size];
  
  const renderLogo = () => {
    if (logoDisplayMode === 'name-only') {
      return (
        <span className={cn(currentSize.text, className)}>
          {siteName}
        </span>
      );
    }

    if (logoDisplayMode === 'logo-only') {
      if (!logoUrl) {
        // Fallback to first letter of site name if no logo
        return (
          <div className={cn(
            currentSize.logo,
            'bg-primary text-primary-foreground rounded flex items-center justify-center font-bold',
            className
          )}>
            {siteName.charAt(0).toUpperCase()}
          </div>
        );
      }
      
      return (
        <img
          src={logoUrl}
          alt={logoAlt || siteName}
          className={cn(currentSize.logo, 'object-contain', className)}
          onError={(e) => {
            // Fallback to first letter if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = cn(
              currentSize.logo,
              'bg-primary text-primary-foreground rounded flex items-center justify-center font-bold'
            );
            fallback.textContent = siteName.charAt(0).toUpperCase();
            target.parentNode?.insertBefore(fallback, target);
          }}
        />
      );
    }

    // logo-with-name (default)
    return (
      <div className={cn('flex items-center', currentSize.gap, className)}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={logoAlt || siteName}
            className={cn(currentSize.logo, 'object-contain')}
            onError={(e) => {
              // Fallback to first letter if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = cn(
                currentSize.logo,
                'bg-primary text-primary-foreground rounded flex items-center justify-center font-bold'
              );
              fallback.textContent = siteName.charAt(0).toUpperCase();
              target.parentNode?.insertBefore(fallback, target);
            }}
          />
        ) : (
          <div className={cn(
            currentSize.logo,
            'bg-primary text-primary-foreground rounded flex items-center justify-center font-bold'
          )}>
            {siteName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className={currentSize.text}>
          {siteName}
        </span>
      </div>
    );
  };

  const content = renderLogo();

  if (href) {
    return (
      <a 
        href={href} 
        className="flex items-center no-underline hover:opacity-80 transition-opacity"
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className="flex items-center bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity"
      >
        {content}
      </button>
    );
  }

  return content;
}

// Hook to use branding data
export function useBranding() {
  const [branding, setBranding] = React.useState<BrandingData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchBranding = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/branding/active');
        const result = await response.json();

        if (result.success) {
          setBranding(result.data);
        } else {
          setError('Failed to load branding');
        }
      } catch (err) {
        console.error('Error fetching branding:', err);
        setError('Failed to load branding');
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  return { branding, loading, error };
}

// Higher-order component to provide branding context
interface BrandingProviderProps {
  children: React.ReactNode;
}

const BrandingContext = React.createContext<{
  branding: BrandingData | null;
  loading: boolean;
  error: string | null;
}>({
  branding: null,
  loading: true,
  error: null,
});

export function BrandingProvider({ children }: BrandingProviderProps) {
  const brandingData = useBranding();

  return (
    <BrandingContext.Provider value={brandingData}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBrandingContext() {
  return React.useContext(BrandingContext);
}

// Smart branding logo that automatically fetches branding data
export function SmartBrandingLogo({
  className,
  size = 'md',
  href,
  onClick,
}: Omit<BrandingLogoProps, 'siteName' | 'logoUrl' | 'logoAlt' | 'logoDisplayMode'>) {
  const { branding, loading } = useBrandingContext();

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <BrandingLogo
      siteName={branding?.siteName}
      logoUrl={branding?.logoUrl}
      logoAlt={branding?.logoAlt}
      logoDisplayMode={branding?.logoDisplayMode}
      className={className}
      size={size}
      href={href}
      onClick={onClick}
    />
  );
}