import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth-client';

interface FavoriteButtonProps {
  listingId: string;
  listingTitle?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({ 
  listingId, 
  listingTitle = 'this item',
  size = 'sm',
  variant = 'secondary',
  className,
  showLabel = false
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  
  // Check if item is already favorited
  const { data: isFavorited, isLoading } = useQuery({
    queryKey: ['is-favorited', listingId],
    queryFn: async () => {
      // We can check this by looking at the favorites list or make a specific API call
      // For now, let's make a simple API call
      const response = await fetch('/api/favorites', {
        credentials: 'include'
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.favorites?.some((fav: any) => fav.listing.id === listingId) || false;
    },
    enabled: !!session?.user,
  });
  
  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ listingId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to favorites');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Added to favorites');
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['is-favorited', listingId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-search'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('already in your favorites')) {
        toast.error('Already in your favorites');
      } else if (error.message.includes('cannot favorite your own listing')) {
        toast.error('You cannot favorite your own listing');
      } else {
        toast.error('Failed to add to favorites');
      }
    }
  });
  
  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/favorites?listingId=${listingId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove from favorites');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Removed from favorites');
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['is-favorited', listingId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-search'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to remove from favorites');
    }
  });
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session?.user) {
      toast.error('Please sign in to save favorites');
      return;
    }
    
    if (isFavorited) {
      removeFromFavoritesMutation.mutate();
    } else {
      addToFavoritesMutation.mutate();
    }
  };
  
  const isPending = addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending;
  
  if (!session?.user) {
    return null; // Don't show the button if user is not authenticated
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={isPending || isLoading}
      className={cn(
        'transition-all duration-200',
        showLabel ? 'gap-2' : size === 'sm' ? 'h-8 w-8 p-0' : 'p-2',
        className
      )}
      title={isFavorited ? `Remove ${listingTitle} from favorites` : `Add ${listingTitle} to favorites`}
    >
      <Heart 
        className={cn(
          'transition-all duration-200',
          size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6',
          isFavorited ? 'text-red-500 fill-red-500' : 'text-muted-foreground hover:text-red-500',
          isPending && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className="hidden sm:inline">
          {isFavorited ? 'Favorited' : 'Save'}
        </span>
      )}
    </Button>
  );
}