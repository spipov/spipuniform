import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Calendar, 
  Bell, 
  Settings, 
  Activity, 
  Clock, 
  Star, 
  BookOpen, 
  Target, 
  TrendingUp,
  FileText,
  Bookmark,
  Heart,
  MessageSquare,
  Zap,
  Gift
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useSession } from '@/lib/auth-client';

interface UserDashboardCardsProps {
  userStats?: any;
}

export function UserDashboardCards({ userStats }: UserDashboardCardsProps) {
  const { data: session } = useSession();
  const user = session?.user;

  // Mock user activity data - in real app, this would come from API
  const mockUserData = {
    recentActivity: [
      { action: "Profile updated", time: "2 hours ago", icon: User },
      { action: "Settings changed", time: "1 day ago", icon: Settings },
      { action: "Account verified", time: "3 days ago", icon: Star },
    ],
    stats: {
      accountAge: Math.floor((Date.now() - new Date(user?.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
      lastLogin: "Today",
      profileCompletion: 85,
    },
    quickActions: [
      { title: "Update Profile", description: "Keep your information current", icon: User, link: "/dashboard/account" },
      { title: "Account Settings", description: "Manage your preferences", icon: Settings, link: "/dashboard/settings" },
      { title: "Security", description: "Review security settings", icon: Settings, link: "/dashboard/account" },
    ]
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Profile Status */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockUserData.stats.profileCompletion}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Profile completion
            </p>
            {mockUserData.stats.profileCompletion < 100 && (
              <Button asChild variant="link" className="p-0 h-auto text-xs mt-2">
                <Link to="/dashboard/account">Complete profile</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Account Age */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockUserData.stats.accountAge}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockUserData.stats.accountAge === 1 ? 'day' : 'days'} ago
            </p>
            <Badge variant="secondary" className="mt-2 text-xs">
              {mockUserData.stats.accountAge > 30 ? 'Veteran' : 'New Member'}
            </Badge>
          </CardContent>
        </Card>

        {/* Last Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Login</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockUserData.stats.lastLogin}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Welcome back!
            </p>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              No new notifications
            </p>
            <Badge variant="outline" className="mt-2 text-xs">
              All caught up!
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your recent account activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockUserData.recentActivity.map((activity) => {
              const IconComponent = activity.icon;
              return (
                <div key={activity.action} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="p-2 rounded-full bg-primary/10">
                    <IconComponent className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {mockUserData.quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Button 
                  key={action.title}
                  asChild 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                >
                  <Link to={action.link}>
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-5 w-5 mt-0.5" />
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </div>
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* App-Specific Placeholders */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Placeholder for App-Specific Content */}
        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-muted-foreground" />
              App Features
            </CardTitle>
            <CardDescription>Application-specific dashboard content will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <div className="space-y-2">
                <div className="flex justify-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  <Target className="h-6 w-6" />
                  <TrendingUp className="h-6 w-6" />
                </div>
                <p className="text-sm">Custom app widgets and metrics</p>
                <p className="text-xs">Configure in your application settings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for User Content */}
        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-muted-foreground" />
              Personal Content
            </CardTitle>
            <CardDescription>Your personalized content and saved items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <div className="space-y-2">
                <div className="flex justify-center gap-2">
                  <Bookmark className="h-6 w-6" />
                  <FileText className="h-6 w-6" />
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="text-sm">Bookmarks, documents, and messages</p>
                <p className="text-xs">Start using the app to see content here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message for New Users */}
      {mockUserData.stats.accountAge < 7 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Gift className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Welcome to the platform!</strong> Take a moment to complete your profile and explore the features available to you.
            <Button asChild variant="link" className="p-0 ml-2 h-auto text-blue-700 underline">
              <Link to="/dashboard/account">Get started</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}