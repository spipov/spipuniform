import React, { useState, useEffect } from 'react';
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
import { Building, Phone, MapPin, Clock, Truck, CreditCard, Globe, Save, CheckCircle, AlertCircle, Facebook, Instagram, Twitter } from 'lucide-react';

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
  completionRate?: string;
  customerRating?: string;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

interface ShopProfileData {
  shop: Shop | null;
  shopProfile: ShopProfile | null;
}

export function ShopProfileManager() {
  const [data, setData] = useState<ShopProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    // Basic shop info
    name: '',
    description: '',
    website: '',
    contactEmail: '',
    phone: '',
    address: '',
    localityId: '',

    // Extended profile
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
      pickup: false,
      delivery: false,
      postal: false,
      radius: '10km'
    },
    paymentMethods: [] as string[]
  });

  const fetchShopProfile = async () => {
    try {
      const response = await fetch('/api/profiles/shop', {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.success) {
        setData(result);

        // Populate form with existing data
        const shop = result.shop;
        const profile = result.shopProfile;

        setFormData({
          name: shop?.name || '',
          description: shop?.description || '',
          website: shop?.website || '',
          contactEmail: shop?.contactEmail || '',
          phone: shop?.phone || '',
          address: shop?.address || '',
          localityId: shop?.localityId || '',
          businessRegistrationNumber: profile?.businessRegistrationNumber || '',
          vatNumber: profile?.vatNumber || '',
          openingHours: profile?.openingHours || {
            monday: '',
            tuesday: '',
            wednesday: '',
            thursday: '',
            friday: '',
            saturday: '',
            sunday: ''
          },
          serviceAreas: profile?.serviceAreas || [],
          specialties: profile?.specialties || [],
          socialMedia: profile?.socialMedia || {
            facebook: '',
            instagram: '',
            twitter: '',
            website: ''
          },
          deliveryOptions: profile?.deliveryOptions || {
            pickup: false,
            delivery: false,
            postal: false,
            radius: '10km'
          },
          paymentMethods: profile?.paymentMethods || []
        });
      } else {
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
        body: JSON.stringify({
          businessRegistrationNumber: formData.businessRegistrationNumber,
          vatNumber: formData.vatNumber,
          openingHours: formData.openingHours,
          serviceAreas: formData.serviceAreas,
          specialties: formData.specialties,
          socialMedia: formData.socialMedia,
          deliveryOptions: formData.deliveryOptions,
          paymentMethods: formData.paymentMethods
        })
      });

      const result = await response.json();

      if (result.success) {
        setData(result);
        toast.success('Shop profile updated successfully');
      } else {
        toast.error(result.error || 'Failed to update shop profile');
      }
    } catch (error) {
      console.error('Error updating shop profile:', error);
      toast.error('Failed to update shop profile');
    } finally {
      setSaving(false);
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
              Manage your shop information and business details
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!data?.shop) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building className="h-8 w-8" />
              Shop Profile
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your shop information and business details
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <Building className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Shop Registered</h3>
            <p className="text-muted-foreground mb-4">
              You haven't registered a shop yet. Register your shop to start selling uniforms.
            </p>
            <Button>Register Shop</Button>
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
            Shop Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your shop information and business details
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data.shop.isVerified ? (
            <Badge className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pending Verification
            </Badge>
          )}
          <Badge variant="secondary">{data.shop.membershipStatus}</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Social & Contact
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="basic" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Shop Information
                  </CardTitle>
                  <CardDescription>
                    Basic details about your shop
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Shop Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Your Shop Name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe your shop and what you offer"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://yourshop.com"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Details
                  </CardTitle>
                  <CardDescription>
                    How customers can reach you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                      placeholder="contact@yourshop.com"
                    />
                  </div>

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
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Your shop address"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Registration</CardTitle>
                <CardDescription>
                  Official business information for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessRegistrationNumber">Business Registration Number</Label>
                    <Input
                      id="businessRegistrationNumber"
                      value={formData.businessRegistrationNumber}
                      onChange={(e) => setFormData({...formData, businessRegistrationNumber: e.target.value})}
                      placeholder="Company registration number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">VAT Number</Label>
                    <Input
                      id="vatNumber"
                      value={formData.vatNumber}
                      onChange={(e) => setFormData({...formData, vatNumber: e.target.value})}
                      placeholder="VAT registration number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Opening Hours
                </CardTitle>
                <CardDescription>
                  When your shop is open for business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(formData.openingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4">
                    <Label className="w-20 capitalize">{day}:</Label>
                    <Input
                      value={hours}
                      onChange={(e) => setFormData({
                        ...formData,
                        openingHours: {
                          ...formData.openingHours,
                          [day]: e.target.value
                        }
                      })}
                      placeholder="9:00-17:00"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery & Service Options
                </CardTitle>
                <CardDescription>
                  How you deliver products and serve customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Delivery Methods</Label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="pickup"
                        checked={formData.deliveryOptions.pickup}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          deliveryOptions: {
                            ...formData.deliveryOptions,
                            pickup: checked
                          }
                        })}
                      />
                      <Label htmlFor="pickup">Pickup Available</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="delivery"
                        checked={formData.deliveryOptions.delivery}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          deliveryOptions: {
                            ...formData.deliveryOptions,
                            delivery: checked
                          }
                        })}
                      />
                      <Label htmlFor="delivery">Local Delivery</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="postal"
                        checked={formData.deliveryOptions.postal}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          deliveryOptions: {
                            ...formData.deliveryOptions,
                            postal: checked
                          }
                        })}
                      />
                      <Label htmlFor="postal">Postal Delivery</Label>
                    </div>
                  </div>

                  {(formData.deliveryOptions.delivery || formData.deliveryOptions.postal) && (
                    <div className="space-y-2">
                      <Label htmlFor="deliveryRadius">Delivery Radius</Label>
                      <Select
                        value={formData.deliveryOptions.radius}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          deliveryOptions: {
                            ...formData.deliveryOptions,
                            radius: value
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5km">5 km</SelectItem>
                          <SelectItem value="10km">10 km</SelectItem>
                          <SelectItem value="20km">20 km</SelectItem>
                          <SelectItem value="50km">50 km</SelectItem>
                          <SelectItem value="nationwide">Nationwide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label>Payment Methods</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Cash', 'Card', 'Bank Transfer', 'PayPal', 'Stripe'].map((method) => (
                      <Badge
                        key={method}
                        variant={formData.paymentMethods.includes(method) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = formData.paymentMethods;
                          const updated = current.includes(method)
                            ? current.filter(m => m !== method)
                            : [...current, method];
                          setFormData({...formData, paymentMethods: updated});
                        }}
                      >
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Media & Online Presence</CardTitle>
                <CardDescription>
                  Connect your shop with social media platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="socialFacebook" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </Label>
                    <Input
                      id="socialFacebook"
                      value={formData.socialMedia.facebook}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: {
                          ...formData.socialMedia,
                          facebook: e.target.value
                        }
                      })}
                      placeholder="https://facebook.com/yourshop"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="socialInstagram" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Label>
                    <Input
                      id="socialInstagram"
                      value={formData.socialMedia.instagram}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: {
                          ...formData.socialMedia,
                          instagram: e.target.value
                        }
                      })}
                      placeholder="https://instagram.com/yourshop"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="socialTwitter" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter/X
                    </Label>
                    <Input
                      id="socialTwitter"
                      value={formData.socialMedia.twitter}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: {
                          ...formData.socialMedia,
                          twitter: e.target.value
                        }
                      })}
                      placeholder="https://twitter.com/yourshop"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="socialWebsite">Additional Website</Label>
                    <Input
                      id="socialWebsite"
                      value={formData.socialMedia.website}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: {
                          ...formData.socialMedia,
                          website: e.target.value
                        }
                      })}
                      placeholder="https://your-other-site.com"
                    />
                  </div>
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