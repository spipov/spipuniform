import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Activity, 
  Mail, 
  Database, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  HardDrive,
  Wifi,
  Shield
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

interface AdminDashboardCardsProps {
  adminStats: any;
}

export function AdminDashboardCards({ adminStats }: AdminDashboardCardsProps) {
  // Get pending users for alerts
  const { data: pendingUsers } = useQuery({
    queryKey: ["pending-users"],
    queryFn: async () => {
      const res = await fetch('/api/users-approval');
      if (!res.ok) return { data: { pending: 0 } };
      return res.json();
    },
    refetchInterval: 15000,
  });

  const pendingCount = pendingUsers?.data?.pending || 0;
  const stats = adminStats?.data;

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {['system-health', 'active-users', 'new-users', 'email-delivery', 'user-management', 'session-analytics'].map((cardType) => (
          <Card key={cardType} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {pendingCount > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>{pendingCount}</strong> user{pendingCount !== 1 ? 's' : ''} pending approval.
            <Button asChild variant="link" className="p-0 ml-2 h-auto text-amber-700 underline">
              <Link to="/dashboard/user-management/users">Review now</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* System Status */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {stats.system.emailConfigured && stats.system.brandingConfigured ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              stats.system.emailConfigured && stats.system.brandingConfigured 
                ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {stats.system.emailConfigured && stats.system.brandingConfigured 
                ? 'Healthy' : 'Attention'
              }
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-xs">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  stats.system.emailConfigured ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                Email System
              </div>
              <div className="flex items-center text-xs">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  stats.system.brandingConfigured ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                Branding Setup
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.active}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {Math.round((stats.users.active / stats.users.total) * 100)}% of total users
            </div>
            <Progress 
              value={(stats.users.active / stats.users.total) * 100} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        {/* New Users Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.newToday}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.users.newLast30Days} in last 30 days
            </div>
            {stats.users.newToday > 0 && (
              <Badge variant="secondary" className="mt-2 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Growing
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Email Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Delivery</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.emails.total > 0 
                ? Math.round(((stats.emails.last30Days - stats.emails.failed) / stats.emails.last30Days) * 100)
                : 100
              }%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.emails.last30Days} sent, {stats.emails.failed} failed
            </div>
            {stats.emails.failed > 0 && (
              <Badge variant="destructive" className="mt-2 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Issues detected
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* User Management Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>User account statistics and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Users</span>
              <span className="font-medium">{stats.users.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <span className="font-medium text-green-600">{stats.users.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Banned Users</span>
              <span className="font-medium text-red-600">{stats.users.banned}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending Approval</span>
              <span className="font-medium text-yellow-600">{pendingCount}</span>
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link to="/dashboard/user-management/users">
                Manage Users
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Session Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Session Analytics
            </CardTitle>
            <CardDescription>User session and security metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Sessions</span>
              <span className="font-medium">{stats.sessions.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Sessions</span>
              <span className="font-medium text-green-600">{stats.sessions.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Session Rate</span>
              <span className="font-medium">
                {stats.users.total > 0 
                  ? Math.round((stats.sessions.active / stats.users.total) * 100)
                  : 0
                }%
              </span>
            </div>
            <Progress 
              value={stats.users.total > 0 ? (stats.sessions.active / stats.users.total) * 100 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>Platform setup and configuration status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Email System</span>
              <Badge variant={stats.system.emailConfigured ? "default" : "destructive"}>
                {stats.system.emailConfigured ? "Configured" : "Not Setup"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Branding</span>
              <Badge variant={stats.system.brandingConfigured ? "default" : "destructive"}>
                {stats.system.brandingConfigured ? "Configured" : "Not Setup"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Database</span>
              <Badge variant="default">
                Connected
              </Badge>
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link to="/dashboard/settings">
                System Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Admins */}
      <Card>
        <CardHeader>
          <CardTitle>Administrative Actions</CardTitle>
          <CardDescription>Quick access to common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/dashboard/user-management/users">
                <Users className="h-4 w-4 mr-2" />
                User Management
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/dashboard/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/dashboard/settings">
                <Server className="h-4 w-4 mr-2" />
                System Settings
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/dashboard/file-manager">
                <HardDrive className="h-4 w-4 mr-2" />
                File Manager
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}