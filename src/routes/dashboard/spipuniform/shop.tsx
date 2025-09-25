import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building, BarChart3, Package } from 'lucide-react';
import { ShopProfileManager } from '@/components/spipuniform/shops/ProfileManager';
import { ShopAnalyticsDashboard } from '@/components/spipuniform/shops/Dashboard';
import { ShopBulkTools } from '@/components/spipuniform/shops/BulkTools';

export const Route = createFileRoute('/dashboard/spipuniform/shop')({
  component: ShopDashboard,
});

function ShopDashboard() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building className="h-8 w-8" />
          Shop Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your shop profile, track performance, and handle listings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="listings" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Listings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ShopProfileManager />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ShopAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="listings" className="mt-6">
          <ShopBulkTools />
        </TabsContent>
      </Tabs>
    </div>
  );
}
