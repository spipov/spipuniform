import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Share2, Heart, MessageCircle, MapPin, Calendar, Eye, Edit, Pause, Trash2, School, Euro } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description?: string;
  price?: string;
  isFree: boolean;
  status: string;
  createdAt: string;
  viewCount: number;
  school?: {
    id: string;
    name: string;
  };
  productType?: {
    id: string;
    name: string;
  };
  condition?: {
    id: string;
    name: string;
  };
  images: Array<{
    id: string;
    url: string;
    altText?: string;
    order: number;
  }>;
  userId: string;
}

export const Route = createFileRoute('/marketplace/listings/$id')({
  component: ListingDetailPage,
});

function ListingDetailPage() {
  const { id } = Route.useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setListing(data.listing);
        setIsOwner(data.isOwner || false);
      } else {
        toast.error('Listing not found');
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  const handleContact = () => {
    toast.info('Contact seller feature coming soon!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: listing?.description,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleEdit = () => {
    window.location.href = `/marketplace/listings/${id}/edit`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <p className="text-muted-foreground mt-2">
          The listing you're looking for doesn't exist or has been removed.
        </p>
        <Button className="mt-4" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          {isOwner && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Images */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              {listing.images.length > 0 ? (
                <div className="space-y-4">
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={listing.images[currentImageIndex]?.url}
                      alt={listing.images[currentImageIndex]?.altText || listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {listing.images.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto">
                      {listing.images.map((image, index) => (
                        <button
                          key={image.id}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                            currentImageIndex === index ? 'border-primary' : 'border-transparent'
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          <img
                            src={image.url}
                            alt={image.altText || `Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">No images available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{listing.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {listing.isFree ? (
                      <Badge className="bg-green-500">FREE</Badge>
                    ) : (
                      <Badge className="bg-green-500">
                        <Euro className="h-3 w-3 mr-1" />
                        {listing.price}
                      </Badge>
                    )}
                    <Badge variant="secondary">{listing.condition?.name}</Badge>
                  </div>
                </div>
                <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                  {listing.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {listing.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{listing.description}</p>
                </div>
              )}

              <div className="space-y-2">
                {listing.school && (
                  <div className="flex items-center gap-2 text-sm">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <span>{listing.school.name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Listed {new Date(listing.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{listing.viewCount} views</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Product Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{listing.productType?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Condition:</span>
                    <span>{listing.condition?.name}</span>
                  </div>
                </div>
              </div>

              {!isOwner && listing.status === 'active' && (
                <div className="space-y-2 pt-4 border-t">
                  <Button className="w-full" onClick={handleContact}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Seller
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    Save to Wishlist
                  </Button>
                </div>
              )}

              {isOwner && (
                <div className="space-y-2 pt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Listing
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Safety Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Safety Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>• Meet in a public place for item exchange</p>
              <p>• Inspect items before completing purchase</p>
              <p>• Don't share personal or financial information</p>
              <p>• Trust your instincts</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}