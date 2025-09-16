import React, { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { User, Phone, MapPin, Bell, Shield, Star, Save, Users, Building, Activity, Clock, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';

interface UserProfile {
  id: string;
  userId: string;
  phone?: string;
  primarySchoolId?: string;
  additionalSchools?: string[];
  localityId?: string;
  preferredContactMethod?: string;
  availability?: string;
  specificArea?: string;
  preferredBrands?: string[];
  preferredConditions?: string[];
  notificationPreferences?: {
    emailNotifications?: boolean;
    appNotifications?: boolean;
    matchFound?: boolean;
    requestFulfilled?: boolean;
    messageReceived?: boolean;
  };
  verificationStatus: string;
  totalRating: string;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ActivityItem {
  id: string;
  type: 'request' | 'sale' | 'purchase' | 'message';
  title: string;
  description: string;
  status: 'pending' | 'fulfilled' | 'cancelled' | 'completed';
  amount?: string;
  createdAt: string;
  updatedAt: string;
}

export const Route = createFileRoute('/dashboard/profile/')({
  component: ProfilePage,
});

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [formData, setFormData] = useState({
    phone: '',
    primarySchoolId: '',
    localityId: '',
    preferredContactMethod: 'email',
    availability: '',
    specificArea: '',
    preferredBrands: [] as string[],
    preferredConditions: [] as string[],
    notificationPreferences: {
      emailNotifications: true,
      appNotifications: true,
      matchFound: true,
      requestFulfilled: true,
      messageReceived: true
    }
  });

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profiles', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
        setFormData({
          phone: data.profile.phone || '',
          primarySchoolId: data.profile.primarySchoolId || '',
          localityId: data.profile.localityId || '',
          preferredContactMethod: data.profile.preferredContactMethod || 'email',
          availability: data.profile.availability || '',
          specificArea: data.profile.specificArea || '',
          preferredBrands: data.profile.preferredBrands || [],
          preferredConditions: data.profile.preferredConditions || [],
          notificationPreferences: {
            emailNotifications: data.profile.notificationPreferences?.emailNotifications ?? true,
            appNotifications: data.profile.notificationPreferences?.appNotifications ?? true,
            matchFound: data.profile.notificationPreferences?.matchFound ?? true,
            requestFulfilled: data.profile.notificationPreferences?.requestFulfilled ?? true,
            messageReceived: data.profile.notificationPreferences?.messageReceived ?? true
          }
        });
        
        // Mock activity log data - in production this would come from transactions/requests API
        setActivityLog([
          {
            id: '1',
            type: 'request',
            title: 'Looking for Year 3 Uniform',
            description: 'Posted request for navy jumper, size 7-8 years',
            status: 'pending',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            type: 'purchase',
            title: 'Purchased School Shoes',
            description: 'Black leather shoes from ABC Uniforms',
            status: 'completed',
            amount: '€35.00',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            type: 'sale',
            title: 'Sold PE Kit',
            description: 'Red PE shorts and white t-shirt, age 9-10',
            status: 'fulfilled',
            amount: '€15.00',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
        toast.success('Profile updated successfully');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'fully_verified':
        return <Badge className="bg-green-500"><Shield className="h-3 w-3 mr-1" />Fully Verified</Badge>;
      case 'phone_verified':
        return <Badge variant="secondary"><Phone className="h-3 w-3 mr-1" />Phone Verified</Badge>;
      case 'email_verified':
        return <Badge variant="secondary">Email Verified</Badge>;
      default:
        return <Badge variant="outline">Unverified</Badge>;
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8" />
              My Profile
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your personal information and preferences
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8" />
            My Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and preferences
          </p>
        </div>
        {profile && (
          <div className="flex items-center gap-3">
            {getVerificationBadge(profile.verificationStatus)}
            {profile.ratingCount > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-medium">{parseFloat(profile.totalRating).toFixed(1)}</span>
                <span className="text-muted-foreground">({profile.ratingCount})</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="family" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Family
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    How other parents and shops can reach you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+353 XX XXX XXXX"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactMethod">Preferred Contact Method</Label>
                    <Select value={formData.preferredContactMethod} onValueChange={(value) => setFormData({...formData, preferredContactMethod: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="app">App Messages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Textarea
                      id="availability"
                      value={formData.availability}
                      onChange={(e) => setFormData({...formData, availability: e.target.value})}
                      placeholder="e.g., Weekday evenings after 6pm, weekends"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Details
                  </CardTitle>
                  <CardDescription>
                    Help others find you for pickup/delivery
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="locality">Primary Locality</Label>
                    <Select value={formData.localityId} onValueChange={(value) => setFormData({...formData, localityId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dublin-1">Dublin 1</SelectItem>
                        <SelectItem value="dublin-2">Dublin 2</SelectItem>
                        <SelectItem value="cork-city">Cork City</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specificArea">Specific Area</Label>
                    <Input
                      id="specificArea"
                      value={formData.specificArea}
                      onChange={(e) => setFormData({...formData, specificArea: e.target.value})}
                      placeholder="e.g., Near shopping center, by school gates"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Choose when you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={formData.notificationPreferences.emailNotifications}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notificationPreferences: {
                          ...formData.notificationPreferences,
                          emailNotifications: checked
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>App Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive in-app notifications</p>
                    </div>
                    <Switch
                      checked={formData.notificationPreferences.appNotifications}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notificationPreferences: {
                          ...formData.notificationPreferences,
                          appNotifications: checked
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Match Found</Label>
                      <p className="text-sm text-muted-foreground">When items you want become available</p>
                    </div>
                    <Switch
                      checked={formData.notificationPreferences.matchFound}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notificationPreferences: {
                          ...formData.notificationPreferences,
                          matchFound: checked
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Messages</Label>
                      <p className="text-sm text-muted-foreground">When you receive new messages</p>
                    </div>
                    <Switch
                      checked={formData.notificationPreferences.messageReceived}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notificationPreferences: {
                          ...formData.notificationPreferences,
                          messageReceived: checked
                        }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shopping Preferences</CardTitle>
                  <CardDescription>
                    Your preferred brands and condition levels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Preferred Brands</Label>
                    <div className="text-sm text-muted-foreground">
                      Add brands you prefer when searching for uniforms
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.preferredBrands.map((brand, index) => (
                        <Badge key={index} variant="secondary">
                          {brand}
                          <button
                            type="button"
                            className="ml-2 text-xs"
                            onClick={() => setFormData({
                              ...formData,
                              preferredBrands: formData.preferredBrands.filter((_, i) => i !== index)
                            })}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const brand = prompt('Enter brand name:');
                          if (brand && !formData.preferredBrands.includes(brand)) {
                            setFormData({
                              ...formData,
                              preferredBrands: [...formData.preferredBrands, brand]
                            });
                          }
                        }}
                      >
                        + Add Brand
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Log
                </CardTitle>
                <CardDescription>
                  Track your requests, sales, purchases, and activity on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLog.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="mx-auto h-12 w-12 mb-4" />
                    <p>No activity yet</p>
                    <p className="text-sm">Your requests, sales, and purchases will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityLog.map((activity) => {
                      const getActivityIcon = (type: string) => {
                        switch (type) {
                          case 'request': return <AlertCircle className="h-4 w-4" />;
                          case 'sale': return <Star className="h-4 w-4" />;
                          case 'purchase': return <ShoppingBag className="h-4 w-4" />;
                          default: return <Activity className="h-4 w-4" />;
                        }
                      };
                      
                      const getStatusBadge = (status: string) => {
                        switch (status) {
                          case 'pending': return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
                          case 'fulfilled': case 'completed': return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
                          case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
                          default: return <Badge variant="outline">{status}</Badge>;
                        }
                      };
                      
                      const getActivityColor = (type: string) => {
                        switch (type) {
                          case 'request': return 'text-blue-600';
                          case 'sale': return 'text-green-600';
                          case 'purchase': return 'text-purple-600';
                          default: return 'text-gray-600';
                        }
                      };
                      
                      return (
                        <div key={activity.id} className="flex items-start gap-3 p-4 border rounded-lg">
                          <div className={`${getActivityColor(activity.type)} mt-0.5`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{activity.title}</h4>
                              {getStatusBadge(activity.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                              {activity.amount && <span className="font-medium">{activity.amount}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        This is sample data. In production, this will show your real requests, sales, and purchases.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="family">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Members
                </CardTitle>
                <CardDescription>
                  Manage your children's details and uniform requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4" />
                  <p>Family member management will be available here.</p>
                  <p className="text-sm">You'll be able to add children, track their sizes, and manage their school details.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Save className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}