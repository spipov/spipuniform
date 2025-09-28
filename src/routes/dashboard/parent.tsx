import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Package, Plus, Target } from 'lucide-react';

export const Route = createFileRoute('/dashboard/parent')({
  component: ParentDashboard,
});

function ParentDashboard() {
  return (
    <div className="dashboard-parent space-y-6">
      <div className="rounded-lg border bg-card text-card-foreground p-6">
        <h1 className="text-3xl font-bold mb-2">Your Dashboard</h1>
        <p className="text-muted-foreground">Manage your own listings and requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="dashboard-parent__card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> My Listings</CardTitle>
            <CardDescription>View, edit, and manage your listings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/marketplace/my-listings"><Button variant="outline" className="w-full justify-start">Go to My Listings</Button></Link>
            <Link to="/marketplace/create"><Button className="w-full justify-start"><Plus className="mr-2 h-4 w-4" /> Create Listing</Button></Link>
          </CardContent>
        </Card>

        <Card className="dashboard-parent__card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> My Requests</CardTitle>
            <CardDescription>Track and manage your requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/marketplace/requests"><Button variant="outline" className="w-full justify-start">Go to Requests</Button></Link>
          </CardContent>
        </Card>

        <Card className="dashboard-parent__card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /> Messages & Favorites</CardTitle>
            <CardDescription>Keep in touch and track items you like</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/marketplace/messages"><Button variant="outline" className="w-full justify-start">Messages</Button></Link>
            <Link to="/marketplace/favorites"><Button variant="outline" className="w-full justify-start"><Heart className="mr-2 h-4 w-4" /> Favorites</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

