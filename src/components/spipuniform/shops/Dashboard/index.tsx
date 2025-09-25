import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  Eye,
  ShoppingBag,
  DollarSign,
  Package,
  Activity,
  Calendar,
  Users,
  Star
} from 'lucide-react';

interface AnalyticsData {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  recentActivity: {
    id: string;
    type: 'listing_view' | 'listing_created' | 'sale' | 'inquiry';
    title: string;
    description: string;
    timestamp: string;
    amount?: number;
  }[];
  popularItems: {
    id: string;
    title: string;
    views: number;
    sales: number;
  }[];
  monthlyStats: {
    month: string;
    views: number;
    sales: number;
    revenue: number;
  }[];
}

export function ShopAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      // TODO: Replace with real API call to /api/shop-analytics
      // const response = await fetch('/api/shop-analytics', { credentials: 'include' });
      // const result = await response.json();
      // if (result.success) {
      //   setAnalytics(result.analytics);
      // } else {
      //   toast.error(result.error || 'Failed to load analytics');
      // }

      // Mock data for development - replace with real API data
      const mockData: AnalyticsData = {
        totalListings: 24,
        activeListings: 18,
        totalViews: 1247,
        totalSales: 12,
        totalRevenue: 345.50,
        averageRating: 4.7,
        totalReviews: 8,
        recentActivity: [
          {
            id: '1',
            type: 'sale',
            title: 'Sold Navy School Jumper',
            description: 'Size 10-11 years to parent in Dublin 4',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            amount: 25.00
          },
          {
            id: '2',
            type: 'listing_view',
            title: 'PE Kit viewed',
            description: 'Red shorts and white t-shirt viewed 5 times',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            type: 'listing_created',
            title: 'New listing created',
            description: 'Added Year 2 School Shoes - Black leather',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '4',
            type: 'inquiry',
            title: 'Customer inquiry',
            description: 'Question about trouser sizing for Age 8-9',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
          }
        ],
        popularItems: [
          { id: '1', title: 'School Jumper - Navy', views: 89, sales: 3 },
          { id: '2', title: 'PE Kit Complete', views: 67, sales: 2 },
          { id: '3', title: 'School Shoes - Black', views: 54, sales: 4 },
          { id: '4', title: 'White Shirt - Long Sleeve', views: 43, sales: 1 },
          { id: '5', title: 'Grey Trousers', views: 38, sales: 2 }
        ],
        monthlyStats: [
          { month: 'Aug', views: 234, sales: 3, revenue: 85.00 },
          { month: 'Sep', views: 345, sales: 5, revenue: 125.50 },
          { month: 'Oct', views: 456, sales: 4, revenue: 135.00 }
        ]
      };

      setAnalytics(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Shop Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Track your shop performance and sales
          </p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Shop Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Track your shop performance and sales
          </p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground">
              Analytics data will be available once you start listing items and making sales.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Shop Analytics
        </h2>
        <p className="text-muted-foreground mt-1">
          Track your shop performance and sales
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalListings}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeListings} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              €{analytics.totalRevenue.toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest activity on your shop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-1 ${
                    activity.type === 'sale' ? 'bg-green-100 text-green-600' :
                    activity.type === 'listing_view' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'listing_created' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {activity.type === 'sale' && <ShoppingBag className="h-3 w-3" />}
                    {activity.type === 'listing_view' && <Eye className="h-3 w-3" />}
                    {activity.type === 'listing_created' && <Package className="h-3 w-3" />}
                    {activity.type === 'inquiry' && <Users className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{activity.title}</p>
                      {activity.amount && (
                        <Badge variant="secondary" className="text-xs">
                          €{activity.amount.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Popular Items
            </CardTitle>
            <CardDescription>
              Your best performing listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.popularItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.views} views • {item.sales} sales
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {item.sales > 0 ? `${((item.sales / item.views) * 100).toFixed(1)}%` : '0%'}
                    </p>
                    <p className="text-xs text-muted-foreground">conversion</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Performance
          </CardTitle>
          <CardDescription>
            Views, sales, and revenue over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 mb-4" />
              <p>Interactive chart will be implemented here</p>
              <p className="text-sm">Showing monthly trends for views, sales, and revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}