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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Building, MapPin, Star, Shield, Save, Phone, Globe, Plus, School, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Shop {
  id: string;
  userId: string;
  name: string;
  description?: string;
  website?: string;
  contactEmail: string;
  phone: string;
  address: string;
  localityId: string;
  membershipStatus: 'pending' | 'active' | 'suspended';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Locality {
  id: string;
  name: string;
  county: string;
}

interface School {
  id: string;
  name: string;
  type: string;
  localityId: string;
}

export const Route = createFileRoute('/dashboard/profile/shop')({
  component: ShopManagementPage,
});

function ShopManagementPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    contactEmail: '',
    phone: '',
    address: '',
    localityId: ''
  });

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
    'Alterations',
    'Custom Tailoring',
    'Dry Cleaning'
  ];

  const fetchShopsAndOptions = async () => {
    try {
      const [shopsResponse, optionsResponse] = await Promise.all([
        fetch('/api/shops', { credentials: 'include' }),
        fetch('/api/shop-options', { credentials: 'include' })
      ]);
      
      const shopsData = await shopsResponse.json();
      const optionsData = await optionsResponse.json();
      
      if (shopsData.success) {
        setShops(shopsData.shops || []);
      } else {
        toast.error('Failed to load shops');
      }
      
      if (optionsData.success) {
        setLocalities(optionsData.localities || []);
        setSchools(optionsData.schools || []);
      } else {
        toast.error('Failed to load options');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load shop data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopsAndOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShops([...shops, data.shop]);
        toast.success(data.message || 'Shop registered successfully!');
        setIsRegistrationOpen(false);
        resetForm();
      } else {
        toast.error(data.error || 'Failed to register shop');
      }
    } catch (error) {
      console.error('Error registering shop:', error);
      toast.error('Failed to register shop');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      website: '',
      contactEmail: '',
      phone: '',
      address: '',
      localityId: ''
    });
  };

  // Functions for specialty and school management will be added later
  // when we extend the database schema

  const getStatusBadge = (shop: Shop) => {
    if (shop.isVerified) {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
    }
    switch (shop.membershipStatus) {
      case 'active':
        return <Badge className="bg-blue-500">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown Status</Badge>;
    }
  };

  const getLocalityName = (localityId: string) => {
    const locality = localities.find(l => l.id === localityId);
    return locality ? `${locality.name}${locality.county ? `, ${locality.county}` : ''}` : 'Unknown';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building className="h-8 w-8" />
              Shop Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Register and manage your uniform shop
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building className="h-8 w-8" />
            Shop Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Register and manage your uniform shop
          </p>
        </div>
        {shops.length === 0 && (
          <Button onClick={() => setIsRegistrationOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Register Shop
          </Button>
        )}
      </div>

      {shops.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No shop registered</h3>
              <p className="text-muted-foreground mb-4">
                Register your uniform shop to start selling to parents and schools in your area.
              </p>
              <Button onClick={() => setIsRegistrationOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register Your Shop
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shops.map((shop) => (
            <Card key={shop.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {shop.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {shop.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(shop)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{shop.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{getLocalityName(shop.localityId)}</span>
                    </div>
                    {shop.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={shop.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {shop.website}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Extended features like supported schools and specialties will be available soon.
                    </div>
                  </div>
                </div>

                {shop.membershipStatus === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Approval Pending</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      Your shop registration is being reviewed by our admin team. You'll be notified once approved.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Shop Registration Dialog */}
      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Your Shop</DialogTitle>
            <DialogDescription>
              Fill out the details below to register your uniform shop. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., ABC School Uniforms"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  placeholder="contact@yourshop.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of your shop and services..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+353 XX XXX XXXX"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://yourshop.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Full shop address..."
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locality">Locality *</Label>
              <Select value={formData.localityId} onValueChange={(value) => setFormData({...formData, localityId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your area" />
                </SelectTrigger>
                <SelectContent>
                  {localities.map((locality) => (
                    <SelectItem key={locality.id} value={locality.id}>
                      {locality.name}{locality.county ? `, ${locality.county}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <School className="h-4 w-4" />
                <span className="font-medium">Coming Soon</span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                School selection, delivery options, and specialties will be available in the next update.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRegistrationOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving || !formData.name || !formData.contactEmail || !formData.phone || !formData.address || !formData.localityId}
              >
                {saving && <Save className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Registering...' : 'Register Shop'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}