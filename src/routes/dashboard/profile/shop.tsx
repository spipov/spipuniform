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
import { Building, Clock, MapPin, Star, Shield, Save, CreditCard, Truck, Phone, Globe } from 'lucide-react';

interface Shop {
  id: string;
  userId: string;
  name: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  localityId?: string;
  membershipStatus: string;
  isVerified: boolean;
  logoFileId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShopProfile {
  id: string;
  shopId: string;
  businessRegistrationNumber?: string;
  vatNumber?: string;
  openingHours?: Record<string, string>;
  serviceAreas?: string[];
  specialties?: string[];
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  deliveryOptions?: {
    pickup?: boolean;
    delivery?: boolean;
    postal?: boolean;
    radius?: string;
  };
  paymentMethods?: string[];
  responseTime?: number;
  completionRate: string;
  customerRating: string;
  totalReviews: number;
  verificationDocuments?: string[];
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const Route = createFileRoute('/dashboard/profile/shop')({
  component: ShopProfilePage,
});

function ShopProfilePage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [formData, setFormData] = useState({
    businessRegistrationNumber: '',
    vatNumber: '',
    openingHours: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    },
    serviceAreas: [] as string[],
    specialties: [] as string[],
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      website: ''
    },
    deliveryOptions: {
      pickup: true,
      delivery: false,
      postal: false,
      radius: ''
    },
    paymentMethods: [] as string[]
  });

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const availablePaymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card Payment' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'stripe', label: 'Stripe' }
  ];

  const availableSpecialties = [
    'School Uniforms',
    'Sports Equipment',
    'PE Kits',
    'School Bags',
    'Shoes',
    'Formal Wear',
    'Casual Uniforms',
    'Accessories',
    'Embroidery',
    'Alterations'
  ];

  const fetchShopProfile = async () => {
    try {
      const response = await fetch('/api/profiles/shop', {
        credentials: 'include'
      });

      // Gracefully handle "no shop yet" without throwing/toast noise
      if (response.status === 404) {
        setShop(null);
        setShopProfile(null);
        return;
      }

      const data = await response.json();

      if (data.success && data.shop && data.shopProfile) {
        setShop(data.shop);
        setShopProfile(data.shopProfile);

        const profile = data.shopProfile;
        setFormData({
          businessRegistrationNumber: profile.businessRegistrationNumber || '',
          vatNumber: profile.vatNumber || '',
          openingHours: profile.openingHours || {
            monday: '', tuesday: '', wednesday: '', thursday: '',
            friday: '', saturday: '', sunday: ''
          },
          serviceAreas: profile.serviceAreas || [],
          specialties: profile.specialties || [],
          socialMedia: profile.socialMedia || {
            facebook: '', instagram: '', twitter: '', website: ''
          },
          deliveryOptions: profile.deliveryOptions || {
            pickup: true, delivery: false, postal: false, radius: ''
          },
          paymentMethods: profile.paymentMethods || []
        });
      } else if (!data.success && data?.error) {
        toast.error(data.error);
      } else if (!data.success) {
        toast.error('Failed to load shop profile');
      }
    } catch (error) {
      console.error('Error fetching shop profile:', error);
      toast.error('Failed to load shop profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch('/api/profiles/shop', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShop(data.shop);
        setShopProfile(data.shopProfile);
        toast.success('Shop profile updated successfully');
      } else {
        toast.error(data.error || 'Failed to update shop profile');
      }
    } catch (error) {
      console.error('Error updating shop profile:', error);
      toast.error('Failed to update shop profile');
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = (specialty: string) => {
    if (!formData.specialties.includes(specialty)) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty]
      });
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    });
  };

  const togglePaymentMethod = (method: string) => {
    const isSelected = formData.paymentMethods.includes(method);
    setFormData({
      ...formData,
      paymentMethods: isSelected
        ? formData.paymentMethods.filter(m => m !== method)
        : [...formData.paymentMethods, method]
    });
  };

  const getVerificationBadge = (shop: Shop) => {
    if (shop.isVerified) {
      return <Badge className="bg-green-500"><Shield className="h-3 w-3 mr-1" />Verified Shop</Badge>;
    }
    switch (shop.membershipStatus) {
      case 'active':
        return <Badge>Active Member</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Approval</Badge>;
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
              <Building className="h-8 w-8" />
              Shop Profile
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your shop's business details and preferences
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No shop found</h3>
              <p className="text-muted-foreground">
                You need to register a shop first before managing your shop profile.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building className="h-8 w-8" />
            {shop.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your shop's business details and preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getVerificationBadge(shop)}
          {shopProfile && shopProfile.totalReviews > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="font-medium">{parseFloat(shopProfile.customerRating).toFixed(1)}</span>
              <span className="text-muted-foreground">({shopProfile.totalReviews})</span>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Business Info
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Services
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Business Registration
                  </CardTitle>
                  <CardDescription>
                    Official business details for verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessReg">Business Registration Number</Label>
                    <Input
                      id="businessReg"
                      value={formData.businessRegistrationNumber}
                      onChange={(e) => setFormData({...formData, businessRegistrationNumber: e.target.value})}
                      placeholder="123456789"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vat">VAT Number</Label>
                    <Input
                      id="vat"
                      value={formData.vatNumber}
                      onChange={(e) => setFormData({...formData, vatNumber: e.target.value})}
                      placeholder="IE1234567FA"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Social Media & Online Presence
                  </CardTitle>
                  <CardDescription>
                    Connect your online profiles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={formData.socialMedia.facebook}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: {...formData.socialMedia, facebook: e.target.value}
                      })}
                      placeholder="https://facebook.com/yourshop"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.socialMedia.instagram}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: {...formData.socialMedia, instagram: e.target.value}
                      })}
                      placeholder="https://instagram.com/yourshop"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.socialMedia.website}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: {...formData.socialMedia, website: e.target.value}
                      })}
                      placeholder="https://yourshop.com"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Opening Hours
                </CardTitle>
                <CardDescription>
                  Set your shop's opening hours for each day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <Label className="w-24 capitalize">{day}</Label>
                      <Input
                        value={formData.openingHours[day]}
                        onChange={(e) => setFormData({
                          ...formData,
                          openingHours: {
                            ...formData.openingHours,
                            [day]: e.target.value
                          }
                        })}
                        placeholder="e.g., 9:00-17:00 or Closed"
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Specialties</CardTitle>
                <CardDescription>
                  What types of uniforms and services do you specialize in?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="gap-1">
                      {specialty}
                      <button
                        type="button"
                        className="ml-1 text-xs hover:text-destructive"
                        onClick={() => removeSpecialty(specialty)}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <Select onValueChange={addSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSpecialties
                      .filter(s => !formData.specialties.includes(s))
                      .map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Options
                  </CardTitle>
                  <CardDescription>
                    How do customers receive their orders?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>In-store Pickup</Label>
                      <p className="text-sm text-muted-foreground">Customers collect from shop</p>
                    </div>
                    <Switch
                      checked={formData.deliveryOptions.pickup}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        deliveryOptions: {
                          ...formData.deliveryOptions,
                          pickup: checked
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Local Delivery</Label>
                      <p className="text-sm text-muted-foreground">Deliver to local customers</p>
                    </div>
                    <Switch
                      checked={formData.deliveryOptions.delivery}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        deliveryOptions: {
                          ...formData.deliveryOptions,
                          delivery: checked
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Postal Service</Label>
                      <p className="text-sm text-muted-foreground">Ship via post nationwide</p>
                    </div>
                    <Switch
                      checked={formData.deliveryOptions.postal}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        deliveryOptions: {
                          ...formData.deliveryOptions,
                          postal: checked
                        }
                      })}
                    />
                  </div>

                  {formData.deliveryOptions.delivery && (
                    <div className="space-y-2">
                      <Label htmlFor="deliveryRadius">Delivery Radius</Label>
                      <Input
                        id="deliveryRadius"
                        value={formData.deliveryOptions.radius}
                        onChange={(e) => setFormData({
                          ...formData,
                          deliveryOptions: {
                            ...formData.deliveryOptions,
                            radius: e.target.value
                          }
                        })}
                        placeholder="e.g., 10km, County wide"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>
                    How do customers pay for their orders?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availablePaymentMethods.map((method) => (
                    <div key={method.value} className="flex items-center justify-between">
                      <Label>{method.label}</Label>
                      <Switch
                        checked={formData.paymentMethods.includes(method.value)}
                        onCheckedChange={() => togglePaymentMethod(method.value)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
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