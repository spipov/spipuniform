import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export const Route = createFileRoute('/marketplace/messages')(
  {
    component: MessagesPage,
  }
);

function MessagesPage() {
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
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with other parents about listings
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The messaging system is currently being developed. 
            Soon you'll be able to communicate directly with other parents 
            about listings, ask questions, and arrange pickups.
          </p>
          <div className="mt-4">
            <Link to="/marketplace/my-listings">
              <Button>
                Manage Your Listings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}