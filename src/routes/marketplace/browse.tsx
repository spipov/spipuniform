import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';

export const Route = createFileRoute('/marketplace/browse')(
  {
    component: BrowsePage,
  }
);

function BrowsePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/marketplace">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Browse Uniforms</h1>
          <p className="text-muted-foreground">
            Find the perfect uniforms for your child
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The browse and search functionality is currently being developed. 
            Soon you'll be able to search and filter through all available uniform listings 
            from other parents in your area.
          </p>
          <div className="mt-4">
            <Link to="/marketplace/create">
              <Button>
                Create a Listing Instead
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}