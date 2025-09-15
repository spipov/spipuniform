import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, 
  Tags, 
  Package, 
  Settings, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Eye,
  Plus,
  Database,
  MapPin
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/dashboard/spipuniform/')({
  component: SpipUniformDashboard,
});

function SpipUniformDashboard() {
  // Fetch SpipUniform system overview data
  const { data: systemStats, isLoading } = useQuery({
    queryKey: ['spipuniform-stats'],
    queryFn: async () => {
      const res = await fetch('/api/spipuniform/admin/categories');
      if (!res.ok) throw new Error('Failed to load system stats');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const stats = systemStats?.summary || {
    categoriesCount: 0,
    typesCount: 0,
    attributesCount: 0,
    attributeValuesCount: 0,
    conditionsCount: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border bg-card text-card-foreground p-6">
        <h1 className="text-3xl font-bold mb-2">
          SpipUniform Marketplace Admin
        </h1>
        <p className="text-muted-foreground">
          Manage your uniform marketplace: product catalog, user accounts, listings, and system settings.
        </p>
      </div>

      {/* System Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categoriesCount}</div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Types</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.typesCount}</div>
            <p className="text-xs text-muted-foreground">Uniform types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attributes</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attributesCount}</div>
            <p className="text-xs text-muted-foreground">Product attributes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Options</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attributeValuesCount}</div>
            <p className="text-xs text-muted-foreground">Attribute values</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conditions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conditionsCount}</div>
            <p className="text-xs text-muted-foreground">Item conditions</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product System Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product System
            </CardTitle>
            <CardDescription>
              Manage product categories, types, attributes, and conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Link to="/dashboard/spipuniform/products/categories">
                <Button variant="outline" className="w-full justify-start">
                  <Tags className="mr-2 h-4 w-4" />
                  Categories
                </Button>
              </Link>
              <Link to="/dashboard/spipuniform/products/types">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Product Types
                </Button>
              </Link>
              <Link to="/dashboard/spipuniform/products/attributes">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Attributes
                </Button>
              </Link>
              <Link to="/dashboard/spipuniform/products/conditions">
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Conditions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Marketplace
            </CardTitle>
            <CardDescription>
              Manage listings, shops, and marketplace activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Link to="/dashboard/spipuniform/shops">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Shops
                </Button>
              </Link>
              <Link to="/dashboard/spipuniform/listings">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Listings
                </Button>
              </Link>
              <Link to="/dashboard/spipuniform/reports">
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Reports
                </Button>
              </Link>
              <Link to="/dashboard/spipuniform/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geographic Data
            </CardTitle>
            <CardDescription>
              Manage counties, localities, and school data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Link to="/dashboard/spipuniform/data-verification">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="mr-2 h-4 w-4" />
                  Data Verification
                </Button>
              </Link>
              <Link to="/dashboard/spipuniform/schools">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="mr-2 h-4 w-4" />
                  Schools
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Current system health and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Product System</span>
                <span className="text-sm font-medium text-green-600">Ready</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Geographic Data</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">OSM Integration</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity placeholder - can be expanded later */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest changes and system updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Activity tracking will be available once the marketplace is active</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}