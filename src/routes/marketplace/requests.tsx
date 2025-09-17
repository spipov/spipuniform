import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart } from 'lucide-react';

export const Route = createFileRoute('/marketplace/requests')(
  {
    component: RequestsPage,
  }
);

function RequestsPage() {
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
          <h1 className="text-3xl font-bold">My Requests</h1>
          <p className="text-muted-foreground">
            Manage your uniform requests and saved searches
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The requests and saved searches functionality is currently being developed. 
            Soon you'll be able to create requests for specific uniform items and get 
            notified when matching listings become available.
          </p>
          <div className="mt-4">
            <Link to="/marketplace/browse">
              <Button>
                Browse Available Items
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}